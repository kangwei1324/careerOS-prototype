import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/portfolio/work-experience/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, company, start_date, end_date, description } = await req.json();

  const db = getDb();
  const entry = (await db.execute({ sql: "SELECT user_id FROM work_experience WHERE id = ?", args: [Number(id)] })).rows[0] as unknown as { user_id: number } | undefined;

  if (!entry || entry.user_id !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.execute({ sql: `UPDATE work_experience
     SET title = ?, company = ?, start_date = ?, end_date = ?, description = ?
     WHERE id = ?`, args: [title, company, start_date, end_date ?? null, description ?? "", Number(id)] });

  return NextResponse.json({ ok: true });
}

// DELETE /api/portfolio/work-experience/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const entry = (await db.execute({ sql: "SELECT user_id FROM work_experience WHERE id = ?", args: [Number(id)] })).rows[0] as unknown as { user_id: number } | undefined;

  if (!entry || entry.user_id !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.execute({ sql: "DELETE FROM work_experience WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
