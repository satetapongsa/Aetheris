-- Aetheris schema (Neon / PostgreSQL)
-- Applied automatically on first request, or manually with `npm run db:init`.

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY,
  user_id     TEXT,                                  -- reserved for auth (later)
  title       TEXT NOT NULL DEFAULT 'แชทใหม่',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id               UUID PRIMARY KEY,
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations (user_id);
