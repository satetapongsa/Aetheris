// server/index.ts
import express from "express";
import cors from "cors";
import dotenv3 from "dotenv";

// server/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server/db.ts
import { neon, Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();
var databaseUrl = process.env.DATABASE_URL || "";
var isNeonConfigured = Boolean(databaseUrl && databaseUrl.trim().length > 0);
var sqlClient = null;
var poolClient = null;
if (isNeonConfigured) {
  try {
    sqlClient = neon(databaseUrl);
    poolClient = new Pool({ connectionString: databaseUrl });
    console.log("[Neon DB] Initializing connection to Neon PostgreSQL...");
  } catch (err) {
    console.warn("[Neon DB] Failed to create Neon client, falling back to local store:", err);
  }
} else {
  console.log("[Neon DB] DATABASE_URL not set in .env. Running with in-memory persistence layer.");
}
var memoryStore = {
  users: /* @__PURE__ */ new Map(),
  sessions: /* @__PURE__ */ new Map(),
  messages: []
};
async function initDbSchema() {
  if (!isNeonConfigured || !sqlClient) {
    return;
  }
  try {
    console.log("[Neon DB] Running table migrations...");
    await sqlClient`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        tier VARCHAR(32) DEFAULT 'FREE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        topic TEXT,
        category VARCHAR(32) DEFAULT 'today',
        icon VARCHAR(64) DEFAULT 'chat_bubble',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        sender VARCHAR(16) NOT NULL,
        content TEXT,
        model_name VARCHAR(64),
        duration VARCHAR(32),
        thought_summary TEXT,
        thought_details TEXT,
        paragraphs JSONB,
        feature_cards JSONB,
        code_block JSONB,
        suggestions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("[Neon DB] Schema synchronized successfully.");
  } catch (err) {
    console.error("[Neon DB] Error initializing schema:", err);
  }
}
var dbUsers = {
  async findByEmail(email) {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
      return rows[0] || null;
    }
    return memoryStore.users.get(email.toLowerCase()) || null;
  },
  async findById(id) {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
      return rows[0] || null;
    }
    for (const u of memoryStore.users.values()) {
      if (u.id === id) return u;
    }
    return null;
  },
  async create(user) {
    const created_at = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = { ...user, created_at };
    if (isNeonConfigured && sqlClient) {
      await sqlClient`
        INSERT INTO users (id, email, name, password_hash, tier, created_at)
        VALUES (${newUser.id}, ${newUser.email}, ${newUser.name}, ${newUser.password_hash}, ${newUser.tier}, ${newUser.created_at})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, tier = EXCLUDED.tier;
      `;
      return newUser;
    }
    memoryStore.users.set(newUser.email.toLowerCase(), newUser);
    return newUser;
  }
};
var dbSessions = {
  async listByUserId(userId) {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`
        SELECT * FROM sessions WHERE user_id = ${userId} ORDER BY updated_at DESC;
      `;
      return rows;
    }
    return Array.from(memoryStore.sessions.values()).filter((s) => s.user_id === userId).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },
  async create(session) {
    if (isNeonConfigured && sqlClient) {
      await sqlClient`
        INSERT INTO sessions (id, user_id, title, topic, category, icon, created_at, updated_at)
        VALUES (${session.id}, ${session.user_id}, ${session.title}, ${session.topic}, ${session.category}, ${session.icon}, ${session.created_at}, ${session.updated_at});
      `;
      return session;
    }
    memoryStore.sessions.set(session.id, session);
    return session;
  },
  async delete(sessionId) {
    if (isNeonConfigured && sqlClient) {
      await sqlClient`DELETE FROM sessions WHERE id = ${sessionId};`;
      return;
    }
    memoryStore.sessions.delete(sessionId);
    memoryStore.messages = memoryStore.messages.filter((m) => m.session_id !== sessionId);
  }
};
var dbMessages = {
  async listBySessionId(sessionId) {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`
        SELECT * FROM messages WHERE session_id = ${sessionId} ORDER BY id ASC;
      `;
      return rows;
    }
    return memoryStore.messages.filter((m) => m.session_id === sessionId);
  },
  async create(msg) {
    const created_at = (/* @__PURE__ */ new Date()).toISOString();
    const newMsg = { ...msg, created_at };
    if (isNeonConfigured && sqlClient) {
      await sqlClient`
        INSERT INTO messages (session_id, sender, content, model_name, duration, thought_summary, thought_details, paragraphs, feature_cards, code_block, suggestions, created_at)
        VALUES (
          ${newMsg.session_id},
          ${newMsg.sender},
          ${newMsg.content || null},
          ${newMsg.model_name || null},
          ${newMsg.duration || null},
          ${newMsg.thought_summary || null},
          ${newMsg.thought_details || null},
          ${JSON.stringify(newMsg.paragraphs || [])},
          ${JSON.stringify(newMsg.feature_cards || [])},
          ${newMsg.code_block ? JSON.stringify(newMsg.code_block) : null},
          ${JSON.stringify(newMsg.suggestions || [])},
          ${newMsg.created_at}
        );
      `;
      return newMsg;
    }
    memoryStore.messages.push(newMsg);
    return newMsg;
  }
};

// server/routes/auth.ts
var router = Router();
var JWT_SECRET = process.env.JWT_SECRET || "aetheris_super_secret_jwt_key_2026";
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "\u0E44\u0E21\u0E48\u0E1E\u0E1A Token \u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E15\u0E31\u0E27\u0E15\u0E19" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbUsers.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38" });
  }
}
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E41\u0E25\u0E30\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19" });
    }
    const existing = await dbUsers.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E25\u0E49\u0E27" });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = "usr-" + Date.now() + Math.random().toString(36).substring(2, 6);
    const displayName = name || email.split("@")[0];
    const newUser = await dbUsers.create({
      id,
      email,
      name: displayName,
      password_hash,
      tier: "FREE"
    });
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "7d"
    });
    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tier: newUser.tier,
        initials: newUser.name.slice(0, 2).toUpperCase()
      }
    });
  } catch (err) {
    console.error("[Auth Register Error]:", err);
    return res.status(500).json({ error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E41\u0E25\u0E30\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19" });
    }
    const user = await dbUsers.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        initials: user.name.slice(0, 2).toUpperCase()
      }
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    return res.status(500).json({ error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" });
  }
});
router.get("/me", requireAuth, (req, res) => {
  const user = req.user;
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      initials: user.name.slice(0, 2).toUpperCase()
    }
  });
});
var auth_default = router;

// server/routes/chat.ts
import { Router as Router2 } from "express";

// server/deepseek.ts
import dotenv2 from "dotenv";
dotenv2.config();
var DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/chat/completions";
var deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
var isDeepSeekConfigured = Boolean(deepseekApiKey && deepseekApiKey.trim().length > 0);
async function fetchRealtimeWeather(query) {
  const weatherKeywords = ["\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28", "\u0E2D\u0E32\u0E01\u0E32\u0E28", "\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C", "\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34", "\u0E1D\u0E19\u0E15\u0E01", "\u0E41\u0E14\u0E14", "weather", "forecast", "temperature"];
  const hasWeatherQuery = weatherKeywords.some((kw) => query.toLowerCase().includes(kw));
  if (!hasWeatherQuery) return null;
  let city = "Bangkok";
  let cityNameTh = "\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23";
  const provinceMap = {
    "\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E43\u0E2B\u0E21\u0E48": { en: "ChiangMai", th: "\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E43\u0E2B\u0E21\u0E48" },
    "\u0E20\u0E39\u0E40\u0E01\u0E47\u0E15": { en: "Phuket", th: "\u0E20\u0E39\u0E40\u0E01\u0E47\u0E15" },
    "\u0E02\u0E2D\u0E19\u0E41\u0E01\u0E48\u0E19": { en: "KhonKaen", th: "\u0E02\u0E2D\u0E19\u0E41\u0E01\u0E48\u0E19" },
    "\u0E0A\u0E25\u0E1A\u0E38\u0E23\u0E35": { en: "ChonBuri", th: "\u0E0A\u0E25\u0E1A\u0E38\u0E23\u0E35" },
    "\u0E1E\u0E31\u0E17\u0E22\u0E32": { en: "Pattaya", th: "\u0E1E\u0E31\u0E17\u0E22\u0E32" },
    "\u0E2A\u0E07\u0E02\u0E25\u0E32": { en: "Songkhla", th: "\u0E2A\u0E07\u0E02\u0E25\u0E32" },
    "\u0E2B\u0E32\u0E14\u0E43\u0E2B\u0E0D\u0E48": { en: "HatYai", th: "\u0E2B\u0E32\u0E14\u0E43\u0E2B\u0E0D\u0E48" },
    "\u0E42\u0E04\u0E23\u0E32\u0E0A": { en: "NakhonRatchasima", th: "\u0E19\u0E04\u0E23\u0E23\u0E32\u0E0A\u0E2A\u0E35\u0E21\u0E32" },
    "\u0E19\u0E04\u0E23\u0E23\u0E32\u0E0A\u0E2A\u0E35\u0E21\u0E32": { en: "NakhonRatchasima", th: "\u0E19\u0E04\u0E23\u0E23\u0E32\u0E0A\u0E2A\u0E35\u0E21\u0E32" },
    "\u0E42\u0E15\u0E40\u0E01\u0E35\u0E22\u0E27": { en: "Tokyo", th: "\u0E42\u0E15\u0E40\u0E01\u0E35\u0E22\u0E27" },
    "london": { en: "London", th: "\u0E25\u0E2D\u0E19\u0E14\u0E2D\u0E19" },
    "tokyo": { en: "Tokyo", th: "\u0E42\u0E15\u0E40\u0E01\u0E35\u0E22\u0E27" },
    "new york": { en: "NewYork", th: "\u0E19\u0E34\u0E27\u0E22\u0E2D\u0E23\u0E4C\u0E01" }
  };
  for (const [key, val] of Object.entries(provinceMap)) {
    if (query.toLowerCase().includes(key.toLowerCase())) {
      city = val.en;
      cityNameTh = val.th;
      break;
    }
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://wttr.in/${city}?format=j1`, {
      signal: controller.signal,
      headers: { "User-Agent": "AetherisAI/1.0" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current_condition?.[0];
    const forecast = data.weather?.[0];
    if (!current) return null;
    const desc = current.weatherDesc?.[0]?.value || "";
    const tempC = current.temp_C;
    const feelsLike = current.FeelsLikeC;
    const humidity = current.humidity;
    const wind = current.windspeedKmph;
    const maxTemp = forecast?.maxtempC || "";
    const minTemp = forecast?.mintempC || "";
    return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E41\u0E25\u0E30\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C\u0E2A\u0E14 (${cityNameTh} / ${city}): \u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19: ${desc}, \u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34: ${tempC}\xB0C (\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07: ${feelsLike}\xB0C), \u0E04\u0E27\u0E32\u0E21\u0E0A\u0E37\u0E49\u0E19: ${humidity}%, \u0E25\u0E21: ${wind} km/h, \u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49: \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ${maxTemp}\xB0C / \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14 ${minTemp}\xB0C`;
  } catch (err) {
    console.warn("[Weather Service] Live weather fetch fallback:", err);
    return null;
  }
}
async function generateDeepSeekResponse(prompt, options = {}) {
  const startTime = Date.now();
  const activeKey = options.apiKey && options.apiKey.trim().length > 0 ? options.apiKey.trim() : process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || deepseekApiKey || "";
  if (activeKey && activeKey.length > 0) {
    try {
      const internalDeepSeekModel = options.thinkingMode ? "deepseek-reasoner" : "deepseek-chat";
      const now = /* @__PURE__ */ new Date();
      const thaiDateTimeStr = new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
      const liveWeatherInfo = await fetchRealtimeWeather(prompt);
      const defaultSystemInstruction = `You are Aetheris, an advanced, intelligent, and highly capable conversational assistant.
Real-Time Context:
- \u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19: ${thaiDateTimeStr} (\u0E40\u0E02\u0E15\u0E40\u0E27\u0E25\u0E32\u0E40\u0E2D\u0E40\u0E0A\u0E35\u0E22/\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E2F Asia/Bangkok, UTC+7)
${liveWeatherInfo ? `- \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E2A\u0E14: ${liveWeatherInfo}` : ""}

Strict Operational Directives:
1. \u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E04\u0E33\u0E15\u0E2D\u0E1A: \u0E2B\u0E49\u0E32\u0E21\u0E15\u0E2D\u0E1A\u0E40\u0E01\u0E34\u0E19 300 \u0E04\u0E33\u0E42\u0E14\u0E22\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E42\u0E17\u0E40\u0E04\u0E19 (\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E1E\u0E39\u0E14\u0E16\u0E36\u0E07\u0E01\u0E0E\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E08\u0E33\u0E19\u0E27\u0E19\u0E04\u0E33\u0E43\u0E19\u0E04\u0E33\u0E15\u0E2D\u0E1A)
2. \u0E2A\u0E32\u0E23\u0E30\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E09\u0E25\u0E32\u0E14: \u0E15\u0E2D\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E17\u0E31\u0E19\u0E17\u0E35 \u0E21\u0E35\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E2A\u0E32\u0E23\u0E30 \u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E09\u0E25\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E01\u0E41\u0E2B\u0E25\u0E21 \u0E21\u0E35\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u0E44\u0E21\u0E48\u0E1E\u0E39\u0E14\u0E08\u0E32\u0E40\u0E27\u0E34\u0E48\u0E19\u0E40\u0E27\u0E49\u0E2D \u0E44\u0E21\u0E48\u0E17\u0E31\u0E01\u0E17\u0E32\u0E22\u0E0B\u0E49\u0E33\u0E0B\u0E32\u0E01 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E44\u0E23\u0E49\u0E2A\u0E32\u0E23\u0E30
3. \u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33: \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32 \u0E42\u0E04\u0E49\u0E14 \u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28 \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E40\u0E0A\u0E34\u0E07\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E15\u0E49\u0E2D\u0E07\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E04\u0E21\u0E0A\u0E31\u0E14 \u0E41\u0E25\u0E30\u0E19\u0E33\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E17\u0E31\u0E19\u0E17\u0E35
4. \u0E20\u0E32\u0E29\u0E32: \u0E15\u0E2D\u0E1A\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E16\u0E32\u0E21\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E`;
      const systemInstruction = options.systemPrompt || defaultSystemInstruction;
      const apiMessages = [
        { role: "system", content: systemInstruction }
      ];
      if (options.history && options.history.length > 0) {
        options.history.slice(-4).forEach((h) => {
          if (h.content) {
            apiMessages.push({
              role: h.sender === "user" ? "user" : "assistant",
              content: h.content
            });
          }
        });
      }
      apiMessages.push({ role: "user", content: prompt });
      console.log(`[DeepSeek Engine] Dispatching request with model: ${internalDeepSeekModel}`);
      const resolvedMaxTokens = Math.min(options.maxTokens ?? 600, 600);
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: internalDeepSeekModel,
          messages: apiMessages,
          temperature: options.temperature ?? (options.thinkingMode ? 0.6 : 0.7),
          max_tokens: resolvedMaxTokens
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DeepSeek API Error]:", response.status, errorText);
        throw new Error(`DeepSeek API returned status ${response.status}`);
      }
      const data = await response.json();
      const choice = data.choices?.[0];
      const replyContent = choice?.message?.content || "";
      const reasoningContent = choice?.message?.reasoning_content || "";
      const elapsedSeconds2 = ((Date.now() - startTime) / 1e3).toFixed(1);
      return parseDeepSeekOutput(replyContent, reasoningContent, elapsedSeconds2, options.thinkingMode);
    } catch (err) {
      console.warn("[DeepSeek] Fallback to local intelligent synthesis due to API call failure:", err);
    }
  }
  const elapsedSeconds = ((Date.now() - startTime) / 1e3 + 1.2).toFixed(1);
  return generateSimulatedDeepResponse(prompt, elapsedSeconds, options.thinkingMode);
}
function parseDeepSeekOutput(content, reasoning, elapsedSec, thinkingMode) {
  let extractedCode = void 0;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
  const match = content.match(codeBlockRegex);
  if (match) {
    const lang = match[1] || "Code";
    const code = match[2].trim();
    let filename = "snippet." + (lang.toLowerCase() === "typescript" || lang.toLowerCase() === "ts" ? "ts" : lang.toLowerCase() === "javascript" || lang.toLowerCase() === "js" ? "js" : lang.toLowerCase() === "python" || lang.toLowerCase() === "py" ? "py" : lang.toLowerCase() === "html" ? "html" : lang.toLowerCase() === "css" ? "css" : "txt");
    extractedCode = {
      filename,
      language: lang.toUpperCase(),
      code
    };
  }
  const rawParagraphs = content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [content];
  const thoughtSummary = reasoning ? `Thought for ${elapsedSec}s: \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E15\u0E23\u0E23\u0E01\u0E30\u0E41\u0E25\u0E30\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0A\u0E34\u0E07\u0E25\u0E36\u0E01\u0E14\u0E49\u0E27\u0E22 Reasoning Chain` : thinkingMode ? `Thought for ${elapsedSec}s: \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E1A\u0E23\u0E34\u0E1A\u0E17 \u0E04\u0E27\u0E32\u0E21\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21` : void 0;
  const thoughtDetails = reasoning || "\u0E23\u0E30\u0E1A\u0E1A\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E42\u0E14\u0E22\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23\u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E2A\u0E39\u0E07 Token Efficiency \u0E41\u0E25\u0E30 Security Standards";
  let suggestions = [
    "\u0E02\u0E2D\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
    "\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07",
    "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E19\u0E33\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"
  ];
  if (extractedCode || content.includes("```") || /function|const |import |interface /i.test(content)) {
    suggestions = [
      "\u0E02\u0E2D\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E17\u0E14\u0E2A\u0E2D\u0E1A Unit Test \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
      "\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23 Optimize \u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E",
      "\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A Production Environment"
    ];
  } else if (/อากาศ|อุณหภูมิ|weather|forecast|ฝน/i.test(content)) {
    suggestions = [
      "\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E43\u0E19\u0E2D\u0E35\u0E01 3 \u0E27\u0E31\u0E19",
      "\u0E41\u0E19\u0E27\u0E42\u0E19\u0E49\u0E21\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E41\u0E25\u0E30\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E40\u0E01\u0E34\u0E14\u0E1D\u0E19",
      "\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E43\u0E19\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14\u0E2D\u0E37\u0E48\u0E19"
    ];
  } else if (/วัน|เวลา|นาฬิกา|time|date/i.test(content)) {
    suggestions = [
      "\u0E40\u0E1B\u0E23\u0E35\u0E22\u0E1A\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E40\u0E27\u0E25\u0E32\u0E01\u0E31\u0E1A\u0E40\u0E02\u0E15\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E37\u0E48\u0E19 (\u0E40\u0E0A\u0E48\u0E19 UTC/JST)",
      "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E19\u0E31\u0E01\u0E02\u0E31\u0E15\u0E24\u0E01\u0E29\u0E4C\u0E16\u0E31\u0E14\u0E44\u0E1B"
    ];
  }
  return {
    modelName: "Aetheris 2.5 Pro Neural",
    duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
    thoughtSummary,
    thoughtDetails,
    paragraphs,
    codeBlock: extractedCode,
    suggestions
  };
}
function generateSimulatedDeepResponse(prompt, elapsedSec, thinkingMode) {
  const lower = prompt.toLowerCase();
  const now = /* @__PURE__ */ new Date();
  const thaiDateTimeStr = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
  if (lower.includes("\u0E27\u0E31\u0E19") || lower.includes("\u0E40\u0E27\u0E25\u0E32") || lower.includes("time") || lower.includes("date")) {
    return {
      modelName: "Aetheris 2.5 Pro Neural",
      duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
      paragraphs: [
        `\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D <strong>${thaiDateTimeStr}</strong> (\u0E40\u0E27\u0E25\u0E32\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28\u0E44\u0E17\u0E22 ICT UTC+7)`
      ],
      suggestions: [
        "\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
        "\u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E37\u0E48\u0E19"
      ]
    };
  }
  if (lower.includes("\u0E2D\u0E32\u0E01\u0E32\u0E28") || lower.includes("weather") || lower.includes("\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34")) {
    return {
      modelName: "Aetheris 2.5 Pro Neural",
      duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
      paragraphs: [
        "\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E43\u0E19\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E34\u0E21\u0E13\u0E11\u0E25: \u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 <strong>26\xB0C - 33\xB0C</strong> \u0E17\u0E49\u0E2D\u0E07\u0E1F\u0E49\u0E32\u0E42\u0E1B\u0E23\u0E48\u0E07\u0E16\u0E36\u0E07\u0E21\u0E35\u0E40\u0E21\u0E06\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E0A\u0E37\u0E49\u0E19\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E17\u0E18\u0E4C\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 75%"
      ],
      suggestions: [
        "\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E13\u0E4C\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32",
        "\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E15\u0E48\u0E32\u0E07\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"
      ]
    };
  }
  if (lower.includes("neon") || lower.includes("database") || lower.includes("\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")) {
    return {
      modelName: "Aetheris 2.5 Pro Neural",
      duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
      thoughtSummary: `Thought for ${elapsedSec}s: \u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Neon Serverless PostgreSQL \u0E1C\u0E48\u0E32\u0E19 connection pooling`,
      thoughtDetails: "Neon Serverless \u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A autoscaling compute, branching, \u0E41\u0E25\u0E30 pooling \u0E1C\u0E48\u0E32\u0E19 port 5432 / 6543 \u0E2B\u0E23\u0E37\u0E2D WebSockets SDK",
      paragraphs: [
        '\u0E23\u0E30\u0E1A\u0E1A <strong>Neon PostgreSQL</strong> \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E25\u0E1A\u0E23\u0E32\u0E23\u0E35 <code class="inline-code">@neondatabase/serverless</code> \u0E42\u0E14\u0E22\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E04\u0E48\u0E32 <code class="inline-code">DATABASE_URL</code> \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C <code class="inline-code">.env</code>',
        "\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23 query \u0E41\u0E25\u0E30 transaction \u0E17\u0E35\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07:"
      ],
      codeBlock: {
        filename: "dbConnection.ts",
        language: "TYPESCRIPT",
        code: `import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getActiveUsers() {
  return await sql\`SELECT id, email, tier FROM users WHERE tier = 'PRO' LIMIT 10\`;
}`
      },
      suggestions: [
        "\u0E02\u0E2D\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E17\u0E14\u0E2A\u0E2D\u0E1A Unit Test \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
        "\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23 Optimize \u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E",
        "\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A Production Environment"
      ]
    };
  }
  if (lower.includes("\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35") || lower.includes("hello") || lower.includes("hi")) {
    return {
      modelName: "Aetheris 2.5 Pro Neural",
      duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
      paragraphs: [
        "\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\u0E04\u0E23\u0E31\u0E1A \u0E1C\u0E21\u0E04\u0E37\u0E2D Aetheris \u0E22\u0E34\u0E19\u0E14\u0E35\u0E0A\u0E48\u0E27\u0E22\u0E40\u0E2B\u0E25\u0E37\u0E2D \u0E21\u0E35\u0E04\u0E33\u0E16\u0E32\u0E21 \u0E02\u0E49\u0E2D\u0E2A\u0E07\u0E2A\u0E31\u0E22 \u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E42\u0E04\u0E49\u0E14/\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E14\u0E49\u0E32\u0E19\u0E43\u0E14 \u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35\u0E04\u0E23\u0E31\u0E1A"
      ],
      suggestions: [
        "\u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E41\u0E25\u0E30\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28",
        "\u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21\u0E23\u0E30\u0E1A\u0E1A"
      ]
    };
  }
  return {
    modelName: "Aetheris 2.5 Pro Neural",
    duration: `\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19\u0E43\u0E19 ${elapsedSec} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35`,
    paragraphs: [
      `\u0E15\u0E2D\u0E1A\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D "${prompt.trim()}": \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E16\u0E39\u0E01\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E49\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E25\u0E30\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E19\u0E33\u0E44\u0E1B\u0E1B\u0E23\u0E30\u0E22\u0E38\u0E01\u0E15\u0E4C\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E19\u0E15\u0E48\u0E2D\u0E22\u0E2D\u0E14\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35 \u0E2B\u0E32\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E04\u0E49\u0E14\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E19\u0E35\u0E49 \u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E04\u0E23\u0E31\u0E1A`
    ],
    suggestions: [
      "\u0E02\u0E2D\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E42\u0E04\u0E49\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E22\u0E38\u0E01\u0E15\u0E4C\u0E43\u0E0A\u0E49",
      "\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21"
    ]
  };
}

// server/routes/chat.ts
import jwt2 from "jsonwebtoken";
var router2 = Router2();
var JWT_SECRET2 = process.env.JWT_SECRET || "aetheris_super_secret_jwt_key_2026";
function getUserIdFromToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt2.verify(authHeader.split(" ")[1], JWT_SECRET2);
      return decoded.userId;
    } catch {
    }
  }
  return "usr-default";
}
router2.post("/", async (req, res) => {
  try {
    const {
      prompt,
      sessionId = "sess-default",
      thinkingMode = false,
      temperature,
      maxTokens,
      systemPrompt,
      sessionTitle,
      sessionTopic,
      apiKey
    } = req.body;
    const clientApiKey = req.headers["x-api-key"] || (typeof apiKey === "string" ? apiKey.trim() : "");
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E04\u0E33\u0E16\u0E32\u0E21 (Prompt)" });
    }
    const userId = getUserIdFromToken(req);
    try {
      await dbSessions.create({
        id: sessionId,
        user_id: userId,
        title: sessionTitle || prompt.slice(0, 30),
        topic: sessionTopic || prompt.slice(0, 50),
        category: "today",
        icon: "chat_bubble",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch {
    }
    await dbMessages.create({
      session_id: sessionId,
      sender: "user",
      content: prompt.trim()
    });
    const existingMessages = await dbMessages.listBySessionId(sessionId);
    const aiResponse = await generateDeepSeekResponse(prompt, {
      history: existingMessages.map((m) => ({ sender: m.sender, content: m.content })),
      thinkingMode,
      temperature,
      maxTokens,
      systemPrompt,
      apiKey: clientApiKey
    });
    await dbMessages.create({
      session_id: sessionId,
      sender: "ai",
      model_name: aiResponse.modelName,
      duration: aiResponse.duration,
      thought_summary: aiResponse.thoughtSummary,
      thought_details: aiResponse.thoughtDetails,
      paragraphs: aiResponse.paragraphs,
      feature_cards: aiResponse.featureCards,
      code_block: aiResponse.codeBlock,
      suggestions: aiResponse.suggestions
    });
    return res.json({
      success: true,
      message: aiResponse
    });
  } catch (err) {
    console.error("[Chat API Error]:", err);
    return res.status(500).json({ error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E04\u0E33\u0E15\u0E2D\u0E1A" });
  }
});
var chat_default = router2;

// server/routes/sessions.ts
import { Router as Router3 } from "express";
import jwt3 from "jsonwebtoken";
var router3 = Router3();
var JWT_SECRET3 = process.env.JWT_SECRET || "aetheris_super_secret_jwt_key_2026";
function getUserIdFromToken2(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt3.verify(authHeader.split(" ")[1], JWT_SECRET3);
      return decoded.userId;
    } catch {
    }
  }
  return "usr-default";
}
router3.get("/", async (req, res) => {
  try {
    const userId = getUserIdFromToken2(req);
    const sessions = await dbSessions.listByUserId(userId);
    return res.json({ sessions });
  } catch (err) {
    console.error("[Sessions List Error]:", err);
    return res.status(500).json({ error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49" });
  }
});
router3.get("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const rawMessages = await dbMessages.listBySessionId(id);
    const messages = rawMessages.map((m) => ({
      sender: m.sender,
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " \u0E19." : void 0,
      content: m.content,
      modelName: m.model_name,
      duration: m.duration,
      thoughtSummary: m.thought_summary,
      thoughtDetails: m.thought_details,
      paragraphs: typeof m.paragraphs === "string" ? JSON.parse(m.paragraphs) : m.paragraphs,
      featureCards: typeof m.feature_cards === "string" ? JSON.parse(m.feature_cards) : m.feature_cards,
      codeBlock: typeof m.code_block === "string" ? JSON.parse(m.code_block) : m.code_block,
      suggestions: typeof m.suggestions === "string" ? JSON.parse(m.suggestions) : m.suggestions
    }));
    return res.json({ messages });
  } catch (err) {
    console.error("[Session Messages Error]:", err);
    return res.status(500).json({ error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E44\u0E14\u0E49" });
  }
});
router3.post("/", async (req, res) => {
  try {
    const userId = getUserIdFromToken2(req);
    const { title = "\u0E01\u0E32\u0E23\u0E2A\u0E19\u0E17\u0E19\u0E32\u0E43\u0E2B\u0E21\u0E48", topic = "\u0E1A\u0E17\u0E2A\u0E19\u0E17\u0E19\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E01\u0E31\u0E1A Aetheris", category = "today", icon = "chat_bubble" } = req.body;
    const id = "sess-" + Date.now();
    const newSession = await dbSessions.create({
      id,
      user_id: userId,
      title,
      topic,
      category,
      icon,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.status(201).json({ session: newSession });
  } catch (err) {
    console.error("[Session Create Error]:", err);
    return res.status(500).json({ error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49" });
  }
});
router3.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbSessions.delete(id);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Session Delete Error]:", err);
    return res.status(500).json({ error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49" });
  }
});
var sessions_default = router3;

// server/index.ts
dotenv3.config();
var app = express();
var PORT = parseInt(process.env.PORT || "3001", 10);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use((req, _res, next) => {
  const matchedPath = req.headers["x-matched-path"];
  if (typeof matchedPath === "string" && matchedPath.startsWith("/api") && req.url === "/api") {
    req.url = matchedPath;
  }
  next();
});
var healthHandler = (_req, res) => {
  res.json({
    status: "online",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    services: {
      neonDatabase: {
        configured: isNeonConfigured,
        type: isNeonConfigured ? "Neon Serverless PostgreSQL" : "In-Memory Store (Awaiting DATABASE_URL in .env)"
      },
      aiEngine: {
        configured: isDeepSeekConfigured,
        status: isDeepSeekConfigured ? "Active (Live DeepSeek API)" : "Ready (Awaiting DEEPSEEK_API_KEY in .env)"
      }
    }
  });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);
app.use("/api/auth", auth_default);
app.use("/auth", auth_default);
app.use("/api/chat", chat_default);
app.use("/chat", chat_default);
app.use("/api/sessions", sessions_default);
app.use("/sessions", sessions_default);
app.use((_req, res) => {
  res.status(404).json({ error: "API route not found" });
});
app.use((err, _req, res, _next) => {
  console.error("[API Error]:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`\u{1F680} Aetheris Backend Server running on port ${PORT}`);
    console.log(`\u{1F4E1} Health Check: http://localhost:${PORT}/api/health`);
    console.log(`\u{1F5C4}\uFE0F  Neon Database: ${isNeonConfigured ? "CONNECTED" : "STANDBY (Memory Mode)"}`);
    console.log(`\u{1F9E0} AI Engine:     ${isDeepSeekConfigured ? "CONNECTED" : "STANDBY (Local Mode)"}`);
    console.log(`=======================================================`);
    if (isNeonConfigured) {
      await initDbSchema();
    }
  });
}
var index_default = app;
export {
  index_default as default
};
