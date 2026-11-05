import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db";
import { isAIConfigured } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "memory" | "error" = "memory";
  let dbError: string | undefined;
  if (isDatabaseConfigured()) {
    try {
      await ensureSchema();
      await getSql()!`SELECT 1`;
      database = "connected";
    } catch (err) {
      database = "error";
      dbError = err instanceof Error ? err.message : String(err);
    }
  }
  return Response.json({
    ok: database !== "error",
    database,
    dbError,
    ai: isAIConfigured() ? "configured" : "missing_key",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  });
}
