import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const isAIConfigured = () => Boolean(process.env.DEEPSEEK_API_KEY);

export const SYSTEM_PROMPT = `You are Aetheris, a helpful, knowledgeable and friendly AI assistant.
- Always reply in the same language the user writes in (Thai → Thai, English → English).
- Be clear and well-structured. Use Markdown: headings, lists, tables and fenced code blocks with a language tag when useful.
- Keep answers concise for simple questions and thorough for complex ones.
- If you are unsure about something, say so honestly.`;

export class DeepSeekError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request(body: object, signal?: AbortSignal) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, ...body }),
    signal,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message ?? "";
    } catch {}
    const msg =
      res.status === 401 ? "DEEPSEEK_API_KEY ไม่ถูกต้อง"
      : res.status === 402 ? "ยอดเงินในบัญชี DeepSeek ไม่เพียงพอ"
      : res.status === 429 ? "มีการใช้งานถี่เกินไป กรุณาลองใหม่อีกครั้ง"
      : `DeepSeek error ${res.status}${detail ? `: ${detail}` : ""}`;
    throw new DeepSeekError(msg, res.status);
  }
  return res;
}

/** Streams assistant text deltas from DeepSeek (OpenAI-compatible SSE). */
export async function* streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string> {
  const res = await request({ messages, stream: true, temperature: 1.0, max_tokens: 8192 }, signal);
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        /* ignore keep-alive / partial lines */
      }
    }
  }
}

/** Generates a short conversation title from the first user message. */
export async function generateTitle(firstMessage: string): Promise<string | null> {
  try {
    const res = await request({
      messages: [
        {
          role: "system",
          content:
            "Create a very short title (max 6 words) for a chat that starts with the user's message. Use the same language as the message. Reply with the title only — no quotes, no punctuation at the end.",
        },
        { role: "user", content: firstMessage.slice(0, 2000) },
      ],
      temperature: 0.3,
      max_tokens: 30,
    });
    const j = await res.json();
    const t = String(j?.choices?.[0]?.message?.content ?? "")
      .replace(/^["'“”«»\s]+|["'“”«»\s.。]+$/g, "")
      .trim();
    return t ? t.slice(0, 80) : null;
  } catch {
    return null;
  }
}
