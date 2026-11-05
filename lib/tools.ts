import "server-only";

/**
 * Tools the AI can call to reach live data: current date/time, real-time market
 * quotes (stocks, indices, crypto, FX, commodities via Yahoo Finance), weather
 * (Open-Meteo), web search (DuckDuckGo) and reading a web page.
 * All sources are free and need no API key.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const TIMEOUT = 12_000;

export type ToolDef = {
  type: "function";
  function: { name: string; description: string; parameters: object };
};

export const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description:
        "Get the exact current date, time and weekday. Use for any question about today, now, current time, dates, ages, countdowns or time zones.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description: "IANA time zone, e.g. Asia/Bangkok, America/New_York, Europe/London. Defaults to the user's time zone.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_quotes",
      description:
        "Real-time quotes for any market worldwide: stocks, ETFs, indices, crypto, forex and commodities. Uses Yahoo Finance tickers: US stocks 'AAPL', Thai stocks add '.BK' ('PTT.BK'), Tokyo '.T' ('7203.T'), Hong Kong '.HK' ('0700.HK'), London '.L', indices '^GSPC' '^IXIC' '^DJI' '^SET.BK' '^N225', crypto 'BTC-USD', forex 'USDTHB=X', gold 'GC=F', oil 'CL=F'. If unsure of a ticker, call search_ticker first. Request several symbols at once when comparing.",
      parameters: {
        type: "object",
        properties: {
          symbols: { type: "array", items: { type: "string" }, description: "Up to 10 Yahoo Finance tickers." },
        },
        required: ["symbols"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_ticker",
      description: "Find Yahoo Finance ticker symbols for a company, index, crypto or fund name (e.g. 'Toyota', 'ปตท', 'Nvidia').",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Current weather and a 3-day forecast for a city or place.",
      parameters: {
        type: "object",
        properties: { location: { type: "string", description: "City name, preferably in English, e.g. 'Bangkok', 'Chiang Mai', 'Tokyo'." } },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for up-to-date information: news, recent events, facts after your training cutoff, prices, sports results, people, products. Returns titles, URLs and snippets. Follow up with read_webpage for details.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_webpage",
      description: "Fetch a web page and return its readable text (truncated). Use after web_search to read a source.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
];

/** Short Thai labels shown in the UI while a tool runs. */
export function toolLabel(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "get_current_datetime":
      return "ตรวจสอบวันและเวลาปัจจุบัน";
    case "get_market_quotes":
      return `ดึงราคาล่าสุด ${(Array.isArray(args.symbols) ? args.symbols : []).slice(0, 5).join(", ")}`.trim();
    case "search_ticker":
      return `ค้นหาสัญลักษณ์ “${args.query ?? ""}”`;
    case "get_weather":
      return `ดูสภาพอากาศ ${args.location ?? ""}`;
    case "web_search":
      return `ค้นเว็บ “${args.query ?? ""}”`;
    case "read_webpage":
      try {
        return `อ่านหน้าเว็บ ${new URL(String(args.url)).hostname}`;
      } catch {
        return "อ่านหน้าเว็บ";
      }
    default:
      return name;
  }
}

async function get(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    // Note: no Accept-Language — DuckDuckGo treats it as a bot signal.
    headers: { "User-Agent": UA, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// ── Date / time ──────────────────────────────────────────────────────────────
export function describeNow(timezone = "Asia/Bangkok") {
  let tz = timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "Asia/Bangkok";
  }
  const now = new Date();
  const fmt = (locale: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts }).format(now);
  return {
    timezone: tz,
    iso_utc: now.toISOString(),
    local: fmt("en-GB", { dateStyle: "full", timeStyle: "long" }),
    thai: fmt("th-TH", { dateStyle: "full", timeStyle: "medium" }),
    unix: Math.floor(now.getTime() / 1000),
  };
}

// ── Markets (Yahoo Finance) ─────────────────────────────────────────────────
async function quote(symbol: string) {
  const s = symbol.trim().toUpperCase();
  const res = await get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1d&range=5d`,
  ).catch(async (e) => {
    // fall back to the second host
    return get(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1d&range=5d`).catch(
      () => {
        throw e;
      },
    );
  });
  const j = await res.json();
  const r = j?.chart?.result?.[0];
  const m = r?.meta;
  if (!m || m.regularMarketPrice == null) throw new Error(j?.chart?.error?.description ?? "no data");

  const closes: number[] = (r.indicators?.quote?.[0]?.close ?? []).filter((x: number | null) => x != null);
  const prev =
    m.previousClose ?? (closes.length >= 2 ? closes[closes.length - 2] : undefined) ?? m.chartPreviousClose;
  const price = m.regularMarketPrice as number;
  const change = prev != null ? price - prev : undefined;
  const round = (n: number | undefined, d = 4) => (n == null ? undefined : Number(n.toFixed(d)));

  return {
    symbol: m.symbol,
    name: m.longName ?? m.shortName,
    exchange: m.fullExchangeName ?? m.exchangeName,
    type: m.instrumentType,
    currency: m.currency,
    price,
    previous_close: round(prev),
    change: round(change),
    change_percent: change != null && prev ? round((change / prev) * 100, 2) : undefined,
    day_high: m.regularMarketDayHigh,
    day_low: m.regularMarketDayLow,
    volume: m.regularMarketVolume,
    week52_high: m.fiftyTwoWeekHigh,
    week52_low: m.fiftyTwoWeekLow,
    market_time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : undefined,
    exchange_timezone: m.exchangeTimezoneName,
  };
}

async function marketQuotes(symbols: unknown) {
  const list = (Array.isArray(symbols) ? symbols : [symbols]).map(String).filter(Boolean).slice(0, 10);
  if (!list.length) return { error: "no symbols given" };
  const results = await Promise.all(
    list.map(async (s) => {
      try {
        return await quote(s);
      } catch (e) {
        // Try resolving a name or a bare Thai ticker
        try {
          const found = await searchTicker(s);
          const first = found.results[0];
          if (first && first.symbol.toUpperCase() !== s.toUpperCase()) return await quote(first.symbol);
        } catch {}
        return { symbol: s, error: `quote unavailable (${e instanceof Error ? e.message : e})` };
      }
    }),
  );
  return { source: "Yahoo Finance", fetched_at: new Date().toISOString(), quotes: results };
}

async function searchTicker(query: string) {
  const res = await get(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
  );
  const j = await res.json();
  return {
    results: ((j?.quotes ?? []) as Record<string, string>[])
      .filter((q) => q.symbol)
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname,
        type: q.typeDisp ?? q.quoteType,
        exchange: q.exchDisp ?? q.exchange,
      })),
  };
}

// ── Weather (Open-Meteo) ────────────────────────────────────────────────────
const WMO: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "rime fog",
  51: "light drizzle", 53: "drizzle", 55: "dense drizzle", 61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 80: "rain showers", 81: "heavy showers", 82: "violent showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "severe thunderstorm with hail",
};

async function weather(location: string) {
  const g = await (
    await get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`)
  ).json();
  const p = g?.results?.[0];
  if (!p) return { error: `location not found: ${location}` };
  const w = await (
    await get(
      `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto`,
    )
  ).json();
  const c = w.current ?? {};
  const d = w.daily ?? {};
  return {
    place: [p.name, p.admin1, p.country].filter(Boolean).join(", "),
    timezone: w.timezone,
    current: {
      time: c.time,
      condition: WMO[c.weather_code] ?? c.weather_code,
      temperature_c: c.temperature_2m,
      feels_like_c: c.apparent_temperature,
      humidity_pct: c.relative_humidity_2m,
      precipitation_mm: c.precipitation,
      wind_kmh: c.wind_speed_10m,
    },
    forecast: (d.time ?? []).map((t: string, i: number) => ({
      date: t,
      condition: WMO[d.weather_code?.[i]] ?? d.weather_code?.[i],
      min_c: d.temperature_2m_min?.[i],
      max_c: d.temperature_2m_max?.[i],
      rain_chance_pct: d.precipitation_probability_max?.[i],
    })),
  };
}

// ── Web search (DuckDuckGo) & page reader ───────────────────────────────────
const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type SearchResult = { title: string; url: string; snippet: string };

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const res = await get("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: query }).toString(),
  });
  const html = await res.text();
  const links = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*class='result-link'[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<td class='result-snippet'>([\s\S]*?)<\/td>/g)].map((m) => decode(m[1]));
  return links.slice(0, 8).map((m, i) => ({ title: decode(m[2]), url: m[1], snippet: snippets[i] ?? "" }));
}

function unwrapBing(href: string) {
  const url = href.replace(/&amp;/g, "&");
  const u = /[?&]u=a1([^&]+)/.exec(url)?.[1];
  if (!u) return url;
  try {
    return Buffer.from(u.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return url;
  }
}

async function searchBing(query: string): Promise<SearchResult[]> {
  const res = await get(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`);
  const html = await res.text();
  return html
    .split('<li class="b_algo"')
    .slice(1, 9)
    .map((block) => {
      const a = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
      const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(block);
      return a ? { title: decode(a[2]), url: unwrapBing(a[1]), snippet: p ? decode(p[1]) : "" } : null;
    })
    .filter((r): r is SearchResult => Boolean(r?.title && r.url.startsWith("http")));
}

async function webSearch(query: string) {
  for (const engine of [searchDuckDuckGo, searchBing]) {
    try {
      const results = await engine(query);
      if (results.length) return { query, results };
    } catch {}
  }
  return { query, results: [], note: "no results" };
}

function isPrivateHost(host: string) {
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith("[")
  );
}

async function readWebpage(url: string) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { error: "invalid url" };
  }
  if (!/^https?:$/.test(u.protocol) || isPrivateHost(u.hostname)) return { error: "url not allowed" };
  const res = await get(u.toString(), { headers: { Accept: "text/html,text/plain,application/json" } });
  const type = res.headers.get("content-type") ?? "";
  let text = await res.text();
  if (type.includes("html")) {
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text)?.[1];
    text = text
      .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n");
    text = (title ? `# ${decode(title)}\n` : "") + text.split("\n").map(decode).filter(Boolean).join("\n");
  }
  return { url: u.toString(), content: text.slice(0, 12_000), truncated: text.length > 12_000 };
}

// ── Dispatcher ──────────────────────────────────────────────────────────────
export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { timezone?: string },
): Promise<unknown> {
  try {
    switch (name) {
      case "get_current_datetime":
        return describeNow(String(args.timezone || ctx.timezone || "Asia/Bangkok"));
      case "get_market_quotes":
        return await marketQuotes(args.symbols);
      case "search_ticker":
        return await searchTicker(String(args.query ?? ""));
      case "get_weather":
        return await weather(String(args.location ?? ""));
      case "web_search":
        return await webSearch(String(args.query ?? ""));
      case "read_webpage":
        return await readWebpage(String(args.url ?? ""));
      default:
        return { error: `unknown tool ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
