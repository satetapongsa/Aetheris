import "server-only";
import { TOOLS, describeNow, runTool, toolLabel } from "./tools";

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[]; reasoning_content?: string }
  | { role: "tool"; content: string; tool_call_id: string };

/** Events streamed from the agent loop to the client. */
export type AgentEvent = { type: "text"; value: string } | { type: "tool"; name: string; label: string };

const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const MAX_TOOL_ROUNDS = 6;

export const isAIConfigured = () => Boolean(process.env.DEEPSEEK_API_KEY);

export function systemPrompt(timezone?: string) {
  const now = describeNow(timezone || "Asia/Bangkok");
  return `You are Aetheris, a highly capable, knowledgeable and friendly AI assistant with live access to the internet through tools.

Current date and time (user's time zone ${now.timezone}): ${now.local} — ${now.thai}. UTC: ${now.iso_utc}.

## Tools — use them instead of guessing
- Anything about "now", today, dates or the time in another place → get_current_datetime.
- Prices of stocks, indices, ETFs, crypto, currencies, gold, oil — anywhere in the world → get_market_quotes (search_ticker first if unsure of the symbol). Never quote a price from memory; always fetch it and state the time of the quote.
- Weather → get_weather.
- News, recent events, anything that may have changed after your training data, or facts you are unsure of → web_search, then read_webpage on the best sources when you need details. Cite sources as Markdown links.
- You may call several tools in one turn and chain them. If a tool fails, try another approach before giving up.

## Answer style
- Always reply in the user's language (Thai → Thai, English → English).
- Format with Markdown so answers are easy to scan: short headings (##), bullet points, **bold** key facts, and tables whenever comparing items or listing numbers (e.g. several stock prices → a table with symbol, price, change, %).
- Put all code in fenced code blocks with a language tag (python, ts, bash, …).
- Simple questions get short answers; complex ones get thorough, structured answers.
- Be honest about uncertainty. Market data is informational, not financial advice.`;
}

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

type Round = { text: string; reasoning: string; toolCalls: ToolCall[] };
type Delta = {
  content?: string;
  reasoning_content?: string;
  tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
};

/** One streamed completion. Yields text deltas; returns the collected tool calls. */
async function* streamRound(
  messages: ChatMessage[],
  signal: AbortSignal | undefined,
  withTools: boolean,
): AsyncGenerator<string, Round> {
  const res = await request(
    {
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    },
    signal,
  );
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const round: Round = { text: "", reasoning: "", toolCalls: [] };

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") break outer;
      let delta: Delta;
      try {
        delta = JSON.parse(data)?.choices?.[0]?.delta ?? {};
      } catch {
        continue; // keep-alive / partial line
      }
      if (delta.reasoning_content) round.reasoning += delta.reasoning_content;
      if (delta.content) {
        round.text += delta.content;
        yield delta.content;
      }
      for (const tc of delta.tool_calls ?? []) {
        const slot = (round.toolCalls[tc.index] ??= {
          id: "",
          type: "function",
          function: { name: "", arguments: "" },
        });
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.function.name += tc.function.name;
        if (tc.function?.arguments) slot.function.arguments += tc.function.arguments;
      }
    }
  }
  round.toolCalls = round.toolCalls.filter(Boolean);
  return round;
}

/**
 * Agent loop: streams the answer and executes tool calls (live data) between
 * rounds until the model produces a final answer.
 */
export async function* runAgent(
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; timezone?: string } = {},
): AsyncGenerator<AgentEvent> {
  const convo = [...messages];
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const gen = streamRound(convo, opts.signal, round < MAX_TOOL_ROUNDS);
    let step = await gen.next();
    while (!step.done) {
      yield { type: "text", value: step.value };
      step = await gen.next();
    }
    const { text, reasoning, toolCalls } = step.value;
    if (!toolCalls.length) return;

    convo.push({
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls,
      ...(reasoning ? { reasoning_content: reasoning } : {}),
    });
    if (text) yield { type: "text", value: "\n\n" };

    const parsed = toolCalls.map((tc) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {}
      return { tc, args };
    });
    for (const { tc, args } of parsed) {
      yield { type: "tool", name: tc.function.name, label: toolLabel(tc.function.name, args) };
    }

    const results = await Promise.all(
      parsed.map(({ tc, args }) => runTool(tc.function.name, args, { timezone: opts.timezone })),
    );
    parsed.forEach(({ tc }, i) =>
      convo.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(results[i]).slice(0, 20_000) }),
    );
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
            "Create a very short title (max 6 words) for a chat that starts with the user's message. Use the same language as the message. Reply with the title only, no quotes, no punctuation at the end.",
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
