import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE /api/portfolio/entries/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const result = await db.execute({ sql: "DELETE FROM portfolio_entries WHERE id = ? AND user_id = ?", args: [Number(id), session.userId] });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/portfolio/entries/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { polished_entry, media, links, pinned_type, pinned_id } = await req.json();
  const db = getDb();

  const result = await db.execute({ sql: `UPDATE portfolio_entries
       SET polished_entry = ?,
           media_json     = ?,
           links_json     = ?,
           pinned_type    = ?,
           pinned_id      = ?,
           updated_at     = datetime('now')
       WHERE id = ? AND user_id = ?`, args: [polished_entry, JSON.stringify(media ?? []), JSON.stringify(links ?? []), pinned_type ?? null, pinned_id   ?? null, Number(id), session.userId] });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
