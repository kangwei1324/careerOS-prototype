import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/portfolio/entries — list all entries for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const entries = (await db.execute({ sql: `SELECT id, raw_log, polished_entry, category, entry_date,
              skills_json, media_json, links_json, pinned_type, pinned_id, created_at
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC`, args: [session.userId] })).rows;

  return NextResponse.json(
    entries.map((e: any) => ({
      ...e,
      skills:      JSON.parse(e.skills_json ?? "[]"),
      media:       JSON.parse(e.media_json  ?? "[]"),
      links:       JSON.parse(e.links_json  ?? "[]"),
      pinned_type: e.pinned_type ?? null,
      pinned_id:   e.pinned_id   ?? null,
    }))
  );
}

// POST /api/portfolio/entries — create new entry
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    raw_log, polished_entry, category, entry_date,
    skills, media, links, pinned_type, pinned_id,
  } = await req.json();

  if (!raw_log || !polished_entry || !entry_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const result = await db.execute({ sql: `INSERT INTO portfolio_entries
         (user_id, raw_log, polished_entry, category, entry_date,
          skills_json, media_json, links_json, pinned_type, pinned_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [session.userId, raw_log, polished_entry, category    ?? "Other", entry_date, JSON.stringify(skills ?? []), JSON.stringify(media  ?? []), JSON.stringify(links  ?? []), pinned_type ?? null, pinned_id   ?? null] });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
