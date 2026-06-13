import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const candidates = (await db.execute({ sql: `
    SELECT
      u.id, u.username,
      cp.name, cp.headline, cp.location, cp.field,
      cp.skills_json, cp.bio,
      COUNT(pe.id) as entry_count
    FROM employer_interests ei
    JOIN users u ON u.id = ei.candidate_id
    JOIN candidate_profiles cp ON cp.user_id = u.id
    LEFT JOIN portfolio_entries pe ON pe.user_id = u.id
    WHERE ei.employer_id = ?
    GROUP BY u.id
    ORDER BY ei.created_at DESC
  `, args: [session.userId] })).rows as unknown as any[];

  return NextResponse.json(
    candidates.map((c) => ({ ...c, skills: JSON.parse(c.skills_json || "[]") }))
  );
}
