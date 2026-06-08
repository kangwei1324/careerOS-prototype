import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/interest — employer expresses interest in a candidate
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await req.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  const db = getDb();

  // Record the interest (UNIQUE constraint handles duplicates)
  const result = db.prepare(
    `INSERT OR IGNORE INTO employer_interests (employer_id, candidate_id) VALUES (?, ?)`
  ).run(session.userId, candidateId);

  // inserted = true only if it was a new row (not a duplicate)
  const inserted = result.changes > 0;

  return NextResponse.json({ ok: true, inserted });
}

// GET /api/interest?candidateId=... — get interest count + employer names for a candidate
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId");
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  const db = getDb();
  const interests = db
    .prepare(
      `SELECT ep.company_name, ei.created_at
       FROM employer_interests ei
       JOIN employer_profiles ep ON ep.user_id = ei.employer_id
       WHERE ei.candidate_id = ?
       ORDER BY ei.created_at DESC`
    )
    .all(Number(candidateId)) as Array<{ company_name: string; created_at: string }>;

  return NextResponse.json({ count: interests.length, employers: interests });
}
