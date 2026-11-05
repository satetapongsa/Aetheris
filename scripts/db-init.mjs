// Usage: npm run db:init   (reads DATABASE_URL from .env.local / .env)
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const f of [".env.local", ".env"]) {
  if (existsSync(f)) process.loadEnvFile(f);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✖ DATABASE_URL is not set (.env.local)");
  process.exit(1);
}

const sql = neon(url);
const statements = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .split(/;\s*$/m)
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter(Boolean);

for (const stmt of statements) await sql.query(stmt);
console.log(`✔ Schema applied (${statements.length} statements)`);
