import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/portfolio/education
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = (await db.execute({ sql: `SELECT id, institution, degree, start_date, end_date
       FROM education
       WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`, args: [session.userId] })).rows;

  return NextResponse.json(rows);
}

// POST /api/portfolio/education
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { institution, degree, start_date, end_date } = await req.json();
  if (!institution || !degree || !start_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const result = await db.execute({ sql: `INSERT INTO education (user_id, institution, degree, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`, args: [session.userId, institution, degree, start_date, end_date ?? null] });

  return NextResponse.json({ id: result.lastInsertRowid });
}
