import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

/** Lazily-created Neon HTTP client. Returns null when DATABASE_URL is not set. */
export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS conversations (
     id UUID PRIMARY KEY,
     user_id TEXT,
     title TEXT NOT NULL DEFAULT 'แชทใหม่',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
     id UUID PRIMARY KEY,
     conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations (user_id)`,
];

/** Creates tables on first use (idempotent, runs once per server instance). */
export function ensureSchema(): Promise<void> {
  const sql = getSql();
  if (!sql) return Promise.resolve();
  schemaReady ??= (async () => {
    for (const stmt of SCHEMA) await sql.query(stmt);
  })().catch((err) => {
    schemaReady = null; // allow retry on next request
    throw err;
  });
  return schemaReady;
}
