import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/onboarding — fetch current profile for editing
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  if (session.role === "candidate") {
    const profile = db
      .prepare("SELECT * FROM candidate_profiles WHERE user_id = ?")
      .get(session.userId) as any;
    return NextResponse.json({
      ...profile,
      skills: JSON.parse(profile?.skills_json || "[]"),
      socials: JSON.parse(profile?.socials_json || "{}")
    });
  } else {
    const profile = db
      .prepare(`
        SELECT ep.*, u.username
        FROM employer_profiles ep
        JOIN users u ON u.id = ep.user_id
        WHERE ep.user_id = ?
      `)
      .get(session.userId) as any;
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
    const { name, headline, location, field, experience_years, skills, socials } = body;
    db.prepare(
      `UPDATE candidate_profiles
       SET name = ?, headline = ?, location = ?, field = ?,
           experience_years = ?, skills_json = ?, socials_json = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      name ?? "",
      headline ?? "",
      location ?? "",
      field ?? "",
      experience_years ?? 0,
      JSON.stringify(skills ?? []),
      JSON.stringify(socials ?? {}),
      session.userId
    );
  } else {
    const { company_name, industry, location, description, company_description, socials } = body;
    db.prepare(
      `UPDATE employer_profiles
       SET company_name = ?, industry = ?, location = ?, description = ?, company_description = ?, socials_json = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      company_name ?? "",
      industry ?? "",
      location ?? "",
      description ?? "",
      company_description ?? "",
      JSON.stringify(socials ?? {}),
      session.userId
    );
  }

  return NextResponse.json({ ok: true });
}
