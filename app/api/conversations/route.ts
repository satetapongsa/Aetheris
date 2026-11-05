import { deleteAllConversations, listConversations } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ conversations: await listConversations() });
  } catch (err) {
    console.error("[conversations] list failed", err);
    return Response.json({ error: "โหลดประวัติแชทไม่สำเร็จ", conversations: [] }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteAllConversations();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[conversations] delete all failed", err);
    return Response.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
