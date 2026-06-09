import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/portfolio/honours
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, issuer, award_date
       FROM honours_awards
       WHERE user_id = ?
       ORDER BY award_date DESC, created_at DESC`
    )
    .all(session.userId);

  return NextResponse.json(rows);
}

// POST /api/portfolio/honours
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, issuer, award_date } = await req.json();
  if (!title || !award_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO honours_awards (user_id, title, issuer, award_date)
       VALUES (?, ?, ?, ?)`
    )
    .run(session.userId, title, issuer ?? "", award_date);

  return NextResponse.json({ id: result.lastInsertRowid });
}
