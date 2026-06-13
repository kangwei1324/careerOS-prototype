import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/talent?field=...&skills=...&location=...&q=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") ?? "";
  const location = searchParams.get("location") ?? "";
  const skillsParam = searchParams.get("skills") ?? "";
  const q = searchParams.get("q") ?? "";

  const db = getDb();

  let query = `
    SELECT
      u.id, u.username,
      cp.name, cp.headline, cp.location, cp.field,
      cp.skills_json, cp.bio,
      (SELECT COUNT(*) FROM portfolio_entries WHERE user_id = u.id) as entry_count
    FROM users u
    JOIN candidate_profiles cp ON cp.user_id = u.id
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
  if (q) {
    query += ` AND (
      LOWER(cp.name) LIKE LOWER(?) OR
      LOWER(cp.headline) LIKE LOWER(?) OR
      LOWER(cp.bio) LIKE LOWER(?) OR
      EXISTS (
        SELECT 1 FROM portfolio_entries pe 
        WHERE pe.user_id = u.id AND LOWER(pe.polished_entry) LIKE LOWER(?)
      )
    )`;
    args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  query += ` ORDER BY entry_count DESC, u.created_at DESC LIMIT 50`;

  interface CandidateRow {
    id: number;
    username: string;
    name: string | null;
    headline: string | null;
    location: string | null;
    field: string | null;
    skills_json: string | null;
    bio: string | null;
    entry_count: number;
  }

  let candidates = (await db.execute({ sql: query, args: [...args] })).rows as unknown as CandidateRow[];

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
