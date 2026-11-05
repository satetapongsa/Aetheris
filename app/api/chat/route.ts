import { NextRequest } from "next/server";
import {
  addMessage,
  createConversation,
  deleteTrailingAssistant,
  getConversation,
  renameConversation,
  truncateFrom,
} from "@/lib/store";
import { DeepSeekError, SYSTEM_PROMPT, generateTitle, isAIConfigured, streamChat, type ChatMessage } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT = 32_000;
const MAX_CONTEXT_CHARS = 120_000;

const json = (body: object, status: number) => Response.json(body, { status });

type Body = {
  conversationId?: string;
  content?: string;
  regenerate?: boolean;
  editMessageId?: string;
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
  const history = buildContext(conv.messages);
  const firstUser = conv.messages.find((m) => m.role === "user")?.content ?? content;
  const needsTitle =
    isNew || (Boolean(body.editMessageId) && conv.messages.filter((m) => m.role === "user").length === 1);

  // Title is generated in parallel with the answer.
  const titlePromise = needsTitle ? generateTitle(firstUser) : Promise.resolve(null);

  // ── Stream the answer ───────────────────────────────────────────────────
  const upstream = new AbortController();
  req.signal.addEventListener("abort", () => upstream.abort());

  let iterator: AsyncGenerator<string>;
  let first: IteratorResult<string>;
  try {
    iterator = streamChat(history, upstream.signal);
    first = await iterator.next(); // surface auth/quota errors as a proper HTTP error
  } catch (err) {
    const status = err instanceof DeepSeekError ? err.status : 502;
    const msg = err instanceof Error ? err.message : "AI error";
    console.error("[chat] deepseek error", msg);
    return json({ error: msg, conversationId }, status >= 400 && status < 600 ? status : 502);
  }

  const encoder = new TextEncoder();
  const cid = conversationId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      try {
        if (!first.done && first.value) {
          answer += first.value;
          controller.enqueue(encoder.encode(first.value));
        }
        if (!first.done) {
          for await (const chunk of iterator) {
            answer += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }
      } catch (err) {
        if (!upstream.signal.aborted) console.error("[chat] stream interrupted", err);
      } finally {
        try {
          if (answer.trim()) await addMessage(cid, "assistant", answer);
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
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": cid,
    },
  });
}

/** System prompt + as much recent history as fits in the context budget. */
function buildContext(messages: { role: string; content: string }[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  let budget = MAX_CONTEXT_CHARS;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user" && m.role !== "assistant") continue;
    budget -= m.content.length;
    if (budget < 0 && out.length > 0) break;
    out.unshift({ role: m.role, content: m.content });
  }
  return [{ role: "system", content: SYSTEM_PROMPT }, ...out];
}
