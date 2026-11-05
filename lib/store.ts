import "server-only";
import { ensureSchema, getSql } from "./db";
import type { Conversation, ConversationWithMessages, Message, Role } from "./types";

/**
 * Persistence layer. Uses Neon Postgres when DATABASE_URL is set,
 * otherwise falls back to an in-memory store (handy for local dev).
 */

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

const mapConv = (r: Record<string, unknown>): Conversation => ({
  id: String(r.id),
  title: String(r.title),
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

const mapMsg = (r: Record<string, unknown>): Message => ({
  id: String(r.id),
  role: r.role as Role,
  content: String(r.content),
  createdAt: iso(r.created_at),
});

// ── In-memory fallback (survives hot reloads) ─────────────────────────────
type Mem = { convs: Map<string, ConversationWithMessages> };
const g = globalThis as unknown as { __aetherisMem?: Mem };
const mem: Mem = (g.__aetherisMem ??= { convs: new Map() });
const now = () => new Date().toISOString();

async function db() {
  const sql = getSql();
  if (sql) await ensureSchema();
  return sql;
}

export async function listConversations(): Promise<Conversation[]> {
  const sql = await db();
  if (!sql) {
    return [...mem.convs.values()]
      .map(({ messages: _m, ...c }) => c)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const rows = await sql`
    SELECT id, title, created_at, updated_at FROM conversations
    ORDER BY updated_at DESC LIMIT 500`;
  return rows.map(mapConv);
}

export async function getConversation(id: string): Promise<ConversationWithMessages | null> {
  const sql = await db();
  if (!sql) {
    const c = mem.convs.get(id);
    return c ? { ...c, messages: [...c.messages] } : null;
  }
  const [conv] = await sql`
    SELECT id, title, created_at, updated_at FROM conversations WHERE id = ${id}`;
  if (!conv) return null;
  const msgs = await sql`
    SELECT id, role, content, created_at FROM chat_messages
    WHERE conversation_id = ${id} ORDER BY created_at ASC`;
  return { ...mapConv(conv), messages: msgs.map(mapMsg) };
}

export async function createConversation(title = "แชทใหม่"): Promise<Conversation> {
  const id = crypto.randomUUID();
  const sql = await db();
  if (!sql) {
    const c = { id, title, createdAt: now(), updatedAt: now(), messages: [] };
    mem.convs.set(id, c);
    return { id, title, createdAt: c.createdAt, updatedAt: c.updatedAt };
  }
  const [row] = await sql`
    INSERT INTO conversations (id, title) VALUES (${id}, ${title})
    RETURNING id, title, created_at, updated_at`;
  return mapConv(row);
}

export async function renameConversation(id: string, title: string): Promise<boolean> {
  const sql = await db();
  if (!sql) {
    const c = mem.convs.get(id);
    if (!c) return false;
    c.title = title;
    return true;
  }
  const rows = await sql`
    UPDATE conversations SET title = ${title} WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return mem.convs.delete(id);
  const rows = await sql`DELETE FROM conversations WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function deleteAllConversations(): Promise<void> {
  const sql = await db();
  if (!sql) return void mem.convs.clear();
  await sql`DELETE FROM conversations`;
}

export async function addMessage(conversationId: string, role: Role, content: string): Promise<Message> {
  const id = crypto.randomUUID();
  const sql = await db();
  if (!sql) {
    const c = mem.convs.get(conversationId);
    if (!c) throw new Error("Conversation not found");
    const m: Message = { id, role, content, createdAt: now() };
    c.messages.push(m);
    c.updatedAt = m.createdAt;
    return m;
  }
  const [row] = await sql`
    INSERT INTO chat_messages (id, conversation_id, role, content)
    VALUES (${id}, ${conversationId}, ${role}, ${content})
    RETURNING id, role, content, created_at`;
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}`;
  return mapMsg(row);
}

/** Removes trailing assistant chat_messages (used by "regenerate"). */
export async function deleteTrailingAssistant(conversationId: string): Promise<void> {
  const sql = await db();
  if (!sql) {
    const c = mem.convs.get(conversationId);
    while (c && c.messages.at(-1)?.role === "assistant") c.messages.pop();
    return;
  }
  await sql`
    DELETE FROM chat_messages
    WHERE conversation_id = ${conversationId}
      AND role = 'assistant'
      AND created_at > COALESCE(
        (SELECT max(created_at) FROM chat_messages WHERE conversation_id = ${conversationId} AND role = 'user'),
        '-infinity'::timestamptz)`;
}

/** Removes a message and everything after it (used by "edit message"). */
export async function truncateFrom(conversationId: string, messageId: string): Promise<boolean> {
  const sql = await db();
  if (!sql) {
    const c = mem.convs.get(conversationId);
    const idx = c?.messages.findIndex((m) => m.id === messageId) ?? -1;
    if (!c || idx < 0) return false;
    c.messages.splice(idx);
    return true;
  }
  const rows = await sql`
    DELETE FROM chat_messages
    WHERE conversation_id = ${conversationId}
      AND created_at >= (SELECT created_at FROM chat_messages WHERE id = ${messageId} AND conversation_id = ${conversationId})
    RETURNING id`;
  return rows.length > 0;
}
