import { NextRequest } from "next/server";
import { deleteConversation, getConversation, renameConversation } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => Response.json({ error: "ไม่พบบทสนทนา" }, { status: 404 });

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();
  const conv = await getConversation(id);
  return conv ? Response.json({ conversation: conv }) : notFound();
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();
  const { title } = (await req.json().catch(() => ({}))) as { title?: string };
  const clean = (title ?? "").trim().slice(0, 120);
  if (!clean) return Response.json({ error: "ชื่อว่างไม่ได้" }, { status: 400 });
  return (await renameConversation(id, clean)) ? Response.json({ ok: true }) : notFound();
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();
  return (await deleteConversation(id)) ? Response.json({ ok: true }) : notFound();
}
