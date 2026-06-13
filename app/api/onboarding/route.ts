import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/onboarding — fetch current profile for editing
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  if (session.role === "candidate") {
    const profile = (await db.execute({ sql: "SELECT * FROM candidate_profiles WHERE user_id = ?", args: [session.userId] })).rows[0] as any;
    return NextResponse.json({
      ...profile,
      skills: JSON.parse(profile?.skills_json || "[]"),
      socials: JSON.parse(profile?.socials_json || "{}")
    });
  } else {
    const profile = (await db.execute({ sql: `
        SELECT ep.*, u.username
        FROM employer_profiles ep
        JOIN users u ON u.id = ep.user_id
        WHERE ep.user_id = ?
      `, args: [session.userId] })).rows[0] as any;
    return NextResponse.json({
      ...profile,
      socials: JSON.parse(profile?.socials_json || "{}")
    });
  }
}

// POST /api/onboarding — save onboarding data
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  if (session.role === "candidate") {
    const { name, headline, location, field, experience_years, skills, socials, bio } = body;
    // Store experience_years as a string so values like "10+" survive the round-trip
    const expYears = experience_years != null ? String(experience_years) : "0";
    await db.execute({ sql: `UPDATE candidate_profiles
       SET name = ?, headline = ?, location = ?, field = ?,
           experience_years = ?, skills_json = ?, socials_json = ?, bio = ?, updated_at = datetime('now')
       WHERE user_id = ?`, args: [name ?? "", headline ?? "", location ?? "", field ?? "", expYears, JSON.stringify(skills ?? []), JSON.stringify(socials ?? {}), bio ?? "", session.userId] });
  } else {
    const { company_name, industry, location, description, company_description, socials } = body;
    await db.execute({ sql: `UPDATE employer_profiles
       SET company_name = ?, industry = ?, location = ?, description = ?, company_description = ?, socials_json = ?, updated_at = datetime('now')
       WHERE user_id = ?`, args: [company_name ?? "", industry ?? "", location ?? "", description ?? "", company_description ?? "", JSON.stringify(socials ?? {}), session.userId] });
  }

  return NextResponse.json({ ok: true });
}
