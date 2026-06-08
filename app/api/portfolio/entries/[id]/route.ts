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

  // Only delete if entry belongs to the current user
  const result = db
    .prepare("DELETE FROM portfolio_entries WHERE id = ? AND user_id = ?")
    .run(Number(id), session.userId);

  if (result.changes === 0) {
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
  const { polished_entry } = await req.json();
  const db = getDb();

  const result = db
    .prepare(
      `UPDATE portfolio_entries
       SET polished_entry = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    )
    .run(polished_entry, Number(id), session.userId);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
