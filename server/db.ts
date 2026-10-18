import { neon, Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

export const isNeonConfigured = Boolean(databaseUrl && databaseUrl.trim().length > 0);

// Initialize Neon Client if connection string is provided
let sqlClient: ReturnType<typeof neon> | null = null;
let poolClient: Pool | null = null;

if (isNeonConfigured) {
  try {
    sqlClient = neon(databaseUrl);
    poolClient = new Pool({ connectionString: databaseUrl });
    console.log('[Neon DB] Initializing connection to Neon PostgreSQL...');
  } catch (err) {
    console.warn('[Neon DB] Failed to create Neon client, falling back to local store:', err);
  }
} else {
  console.log('[Neon DB] DATABASE_URL not set in .env. Running with in-memory persistence layer.');
}

// In-Memory Fallback Store (when DATABASE_URL is not yet provided by user)
export interface DBUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  tier: string;
  created_at: string;
}

export interface DBSession {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  category: 'today' | 'week' | 'older';
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id?: number;
  session_id: string;
  sender: 'user' | 'ai';
  content?: string;
  model_name?: string;
  duration?: string;
  thought_summary?: string;
  thought_details?: string;
  paragraphs?: any;
  feature_cards?: any;
  code_block?: any;
  suggestions?: any;
  created_at?: string;
}

const memoryStore = {
  users: new Map<string, DBUser>(),
  sessions: new Map<string, DBSession>(),
  messages: [] as DBMessage[]
};

/**
 * Initialize Schema on Neon DB
 */
export async function initDbSchema() {
  if (!isNeonConfigured || !sqlClient) {
    return;
  }

  try {
    console.log('[Neon DB] Running table migrations...');

    // Users table
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

    // Chat sessions table
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

    // Messages table
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

    // Indexes for high-speed queries
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);`;

    console.log('[Neon DB] Schema and high-performance indexes synchronized successfully.');
  } catch (err) {
    console.error('[Neon DB] Error initializing schema:', err);
  }
}

/**
 * Database Operations: Users
 */
export const dbUsers = {
  async findByEmail(email: string): Promise<DBUser | null> {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
      return (rows[0] as DBUser) || null;
    }
    return memoryStore.users.get(email.toLowerCase()) || null;
  },

  async findById(id: string): Promise<DBUser | null> {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
      return (rows[0] as DBUser) || null;
    }
    for (const u of memoryStore.users.values()) {
      if (u.id === id) return u;
    }
    return null;
  },

  async create(user: Omit<DBUser, 'created_at'>): Promise<DBUser> {
    const created_at = new Date().toISOString();
    const newUser: DBUser = { ...user, created_at };

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

/**
 * Database Operations: Sessions & Messages
 */
export const dbSessions = {
  async listByUserId(userId: string): Promise<DBSession[]> {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`
        SELECT * FROM sessions WHERE user_id = ${userId} ORDER BY updated_at DESC;
      `;
      return rows as DBSession[];
    }
    return Array.from(memoryStore.sessions.values())
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async create(session: DBSession): Promise<DBSession> {
    if (isNeonConfigured && sqlClient) {
      await sqlClient`
        INSERT INTO sessions (id, user_id, title, topic, category, icon, created_at, updated_at)
        VALUES (${session.id}, ${session.user_id}, ${session.title}, ${session.topic}, ${session.category}, ${session.icon}, ${session.created_at}, ${session.updated_at})
        ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at, title = EXCLUDED.title, topic = EXCLUDED.topic;
      `;
      return session;
    }
    memoryStore.sessions.set(session.id, session);
    return session;
  },

  async delete(sessionId: string): Promise<void> {
    if (isNeonConfigured && sqlClient) {
      await sqlClient`DELETE FROM sessions WHERE id = ${sessionId};`;
      return;
    }
    memoryStore.sessions.delete(sessionId);
    memoryStore.messages = memoryStore.messages.filter(m => m.session_id !== sessionId);
  }
};

export const dbMessages = {
  async listBySessionId(sessionId: string): Promise<DBMessage[]> {
    if (isNeonConfigured && sqlClient) {
      const rows = await sqlClient`
        SELECT * FROM messages WHERE session_id = ${sessionId} ORDER BY id ASC;
      `;
      return rows as DBMessage[];
    }
    return memoryStore.messages.filter(m => m.session_id === sessionId);
  },

  async create(msg: DBMessage): Promise<DBMessage> {
    const created_at = new Date().toISOString();
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
