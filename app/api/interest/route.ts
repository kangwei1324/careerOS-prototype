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
  const result = await db.execute({ sql: `INSERT OR IGNORE INTO employer_interests (employer_id, candidate_id) VALUES (?, ?)`, args: [session.userId, candidateId] });

  // inserted = true only if it was a new row (not a duplicate)
  const inserted = result.rowsAffected > 0;

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
  const interestsAndOffers = (await db.execute({ sql: `SELECT u.username, ep.company_name, 
              MAX(COALESCE(ei.created_at, eo.created_at)) as created_at,
              eo.offer_type, eo.field, eo.role_name, eo.job_description, eo.min_salary, eo.max_salary, eo.status,
              MAX(ei.employer_id IS NOT NULL) as has_interest,
              MAX(eo.id IS NOT NULL) as has_offer
       FROM users u
       JOIN employer_profiles ep ON ep.user_id = u.id
       LEFT JOIN employer_interests ei ON ei.employer_id = u.id AND ei.candidate_id = ?
       LEFT JOIN employer_offers eo ON eo.employer_id = u.id AND eo.candidate_id = ?
       WHERE ei.candidate_id = ? OR eo.candidate_id = ?
       GROUP BY u.id
       ORDER BY created_at DESC`, args: [Number(candidateId), Number(candidateId), Number(candidateId), Number(candidateId)] })).rows as unknown as Array<any>;

  return NextResponse.json({ count: interestsAndOffers.length, employers: interestsAndOffers });
}

// DELETE /api/interest — employer removes interest in a candidate
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await req.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  const db = getDb();
  const result = await db.execute({ sql: `DELETE FROM employer_interests WHERE employer_id = ? AND candidate_id = ?`, args: [session.userId, candidateId] });

  const deleted = result.rowsAffected > 0;
  return NextResponse.json({ ok: true, deleted });
}
