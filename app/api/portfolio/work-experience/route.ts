import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/portfolio/work-experience
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, company, start_date, end_date, description
       FROM work_experience
       WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`
    )
    .all(session.userId);

  return NextResponse.json(rows);
}

// POST /api/portfolio/work-experience
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, company, start_date, end_date, description } = await req.json();
  if (!title || !company || !start_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO work_experience (user_id, title, company, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(session.userId, title, company, start_date, end_date ?? null, description ?? "");

  return NextResponse.json({ id: result.lastInsertRowid });
}
