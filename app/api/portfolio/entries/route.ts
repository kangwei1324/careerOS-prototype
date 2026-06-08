import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/portfolio/entries — list all entries for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const entries = db
    .prepare(
      `SELECT id, raw_log, polished_entry, category, entry_date, skills_json, created_at
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC`
    )
    .all(session.userId);

  return NextResponse.json(
    entries.map((e: any) => ({ ...e, skills: JSON.parse(e.skills_json) }))
  );
}

// POST /api/portfolio/entries — create new entry
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { raw_log, polished_entry, category, entry_date, skills } = await req.json();

  if (!raw_log || !polished_entry || !entry_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO portfolio_entries (user_id, raw_log, polished_entry, category, entry_date, skills_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      session.userId,
      raw_log,
      polished_entry,
      category ?? "Other",
      entry_date,
      JSON.stringify(skills ?? [])
    );

  return NextResponse.json({ id: result.lastInsertRowid });
}
