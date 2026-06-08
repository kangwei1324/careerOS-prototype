import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/talent?field=...&skills=...&location=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") ?? "";
  const location = searchParams.get("location") ?? "";
  const skillsParam = searchParams.get("skills") ?? "";

  const db = getDb();

  let query = `
    SELECT
      u.id, u.username,
      cp.name, cp.headline, cp.location, cp.field,
      cp.skills_json, cp.bio,
      COUNT(pe.id) as entry_count
    FROM users u
    JOIN candidate_profiles cp ON cp.user_id = u.id
    LEFT JOIN portfolio_entries pe ON pe.user_id = u.id
    WHERE u.role = 'candidate'
  `;

  const args: string[] = [];

  if (field) {
    query += ` AND LOWER(cp.field) LIKE LOWER(?)`;
    args.push(`%${field}%`);
  }
  if (location) {
    query += ` AND LOWER(cp.location) LIKE LOWER(?)`;
    args.push(`%${location}%`);
  }

  query += ` GROUP BY u.id ORDER BY entry_count DESC, u.created_at DESC LIMIT 50`;

  let candidates = db.prepare(query).all(...args) as any[];

  // Client-side skill filter (SQLite JSON querying is limited)
  if (skillsParam) {
    const filterSkills = skillsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    candidates = candidates.filter((c) => {
      const skills: string[] = JSON.parse(c.skills_json || "[]");
      return filterSkills.some((fs) =>
        skills.some((s) => s.toLowerCase().includes(fs))
      );
    });
  }

  return NextResponse.json(
    candidates.map((c) => ({ ...c, skills: JSON.parse(c.skills_json || "[]") }))
  );
}
