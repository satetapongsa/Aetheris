import { NextRequest } from "next/server";
import {
  addMessage,
  createConversation,
  deleteTrailingAssistant,
  getConversation,
  renameConversation,
  truncateFrom,
} from "@/lib/store";
import {
  DeepSeekError,
  generateTitle,
  isAIConfigured,
  runAgent,
  systemPrompt,
  type AgentEvent,
  type ChatMessage,
} from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_INPUT = 32_000;
const MAX_CONTEXT_CHARS = 120_000;

const json = (body: object, status: number) => Response.json(body, { status });

type Body = {
  conversationId?: string;
  content?: string;
  regenerate?: boolean;
  editMessageId?: string;
  timezone?: string;
};

export async function POST(req: NextRequest) {
  if (!isAIConfigured()) {
    return json({ error: "ยังไม่ได้ตั้งค่า DEEPSEEK_API_KEY ในไฟล์ .env.local" }, 503);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const content = (body.content ?? "").trim();
  const regenerate = Boolean(body.regenerate);
  if (!regenerate && !content) return json({ error: "กรุณาพิมพ์ข้อความ" }, 400);
  if (content.length > MAX_INPUT) return json({ error: "ข้อความยาวเกินไป" }, 413);

  // ── Resolve conversation & persist the user's turn ──────────────────────
  let conversationId = body.conversationId;
  let isNew = false;
  try {
    if (conversationId) {
      if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return json({ error: "ไม่พบบทสนทนา" }, 404);
      const existing = await getConversation(conversationId);
      if (!existing) return json({ error: "ไม่พบบทสนทนา" }, 404);
    } else {
      if (regenerate) return json({ error: "ไม่มีบทสนทนาให้สร้างคำตอบใหม่" }, 400);
      const conv = await createConversation(content.slice(0, 60));
      conversationId = conv.id;
      isNew = true;
    }

    if (regenerate) {
      await deleteTrailingAssistant(conversationId);
    } else {
      if (body.editMessageId) await truncateFrom(conversationId, body.editMessageId);
      await addMessage(conversationId, "user", content);
    }
  } catch (err) {
    console.error("[chat] storage error", err);
    return json({ error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" }, 500);
  }

  const conv = (await getConversation(conversationId))!;
  const timezone = typeof body.timezone === "string" ? body.timezone.slice(0, 64) : undefined;
  const history = buildContext(conv.messages, timezone);
  const firstUser = conv.messages.find((m) => m.role === "user")?.content ?? content;
  const needsTitle =
    isNew || (Boolean(body.editMessageId) && conv.messages.filter((m) => m.role === "user").length === 1);

  // Title is generated in parallel with the answer.
  const titlePromise = needsTitle ? generateTitle(firstUser) : Promise.resolve(null);

  // ── Stream the answer ───────────────────────────────────────────────────
  const upstream = new AbortController();
  req.signal.addEventListener("abort", () => upstream.abort());

  let iterator: AsyncGenerator<AgentEvent>;
  let first: IteratorResult<AgentEvent>;
  try {
    iterator = runAgent(history, { signal: upstream.signal, timezone });
    first = await iterator.next(); // surface auth/quota errors as a proper HTTP error
  } catch (err) {
    const status = err instanceof DeepSeekError ? err.status : 502;
    const msg = err instanceof Error ? err.message : "AI error";
    console.error("[chat] deepseek error", msg);
    return json({ error: msg, conversationId }, status >= 400 && status < 600 ? status : 502);
  }

  const encoder = new TextEncoder();
  const cid = conversationId;

  // NDJSON: {"t":"text","v":"..."} | {"t":"tool","v":"label"} | {"t":"error","v":"..."}
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      const emit = (ev: AgentEvent) => {
        if (ev.type === "text") answer += ev.value;
        const line = ev.type === "text" ? { t: "text", v: ev.value } : { t: "tool", v: ev.label };
        controller.enqueue(encoder.encode(JSON.stringify(line) + "\n"));
      };
      try {
        if (!first.done) {
          emit(first.value);
          for await (const ev of iterator) emit(ev);
        }
      } catch (err) {
        if (!upstream.signal.aborted) {
          console.error("[chat] stream interrupted", err);
          try {
            const msg = err instanceof Error ? err.message : "stream error";
            controller.enqueue(encoder.encode(JSON.stringify({ t: "error", v: msg }) + "\n"));
          } catch {}
        }
      } finally {
        try {
          if (answer.trim()) await addMessage(cid, "assistant", answer.trim());
          const title = await titlePromise;
          if (title) await renameConversation(cid, title);
        } catch (err) {
          console.error("[chat] failed to save answer", err);
        }
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": cid,
    },
  });
}

/** System prompt + as much recent history as fits in the context budget. */
function buildContext(messages: { role: string; content: string }[], timezone?: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  let budget = MAX_CONTEXT_CHARS;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user" && m.role !== "assistant") continue;
    budget -= m.content.length;
    if (budget < 0 && out.length > 0) break;
    out.unshift({ role: m.role, content: m.content });
  }
  return [{ role: "system", content: systemPrompt(timezone) }, ...out];
}
