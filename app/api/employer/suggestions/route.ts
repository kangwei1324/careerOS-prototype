import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { suggestCandidates } from "@/lib/gemini";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // 1. Get the current employer's profile description
  const employer = db
    .prepare("SELECT description FROM employer_profiles WHERE user_id = ?")
    .get(session.userId) as { description: string } | undefined;

  if (!employer || !employer.description.trim()) {
    return NextResponse.json([]); // Return empty if search requirements are empty
  }

  // 2. Query all candidates and their profiles
  const candidatesRaw = db.prepare(`
    SELECT
      u.id, u.username,
      cp.name, cp.headline, cp.location, cp.field,
      cp.skills_json, cp.bio
    FROM users u
    JOIN candidate_profiles cp ON cp.user_id = u.id
    WHERE u.role = 'candidate'
  `).all() as any[];

  if (candidatesRaw.length === 0) {
    return NextResponse.json([]);
  }

  // 3. For each candidate, fetch recent portfolio logs to build a summary
  const candidatesForAi = candidatesRaw.map((c) => {
    const entries = db.prepare(`
      SELECT polished_entry, category
      FROM portfolio_entries
      WHERE user_id = ?
      ORDER BY entry_date DESC
      LIMIT 3
    `).all(c.id) as Array<{ polished_entry: string; category: string }>;

    const portfolioSummary = entries.map((e) => `[${e.category}] ${e.polished_entry}`).join("; ");

    return {
      id: c.id,
      name: c.name || c.username,
      headline: c.headline || "",
      field: c.field || "",
      skills: JSON.parse(c.skills_json || "[]") as string[],
      bio: c.bio || "",
      portfolio_summary: portfolioSummary || "No portfolio entries yet."
    };
  });

  // 4. Send to Gemini for ranking and reasons
  const aiMatches = await suggestCandidates(employer.description, candidatesForAi);

  // 5. Build full profiles response for recommended matches
  const matchedCandidates = aiMatches.map((match) => {
    const rawCandidate = candidatesRaw.find((c) => c.id === match.id);
    if (!rawCandidate) return null;

    // Get count of portfolio entries
    const entriesCount = db
      .prepare("SELECT COUNT(*) as count FROM portfolio_entries WHERE user_id = ?")
      .get(rawCandidate.id) as { count: number };

    return {
      id: rawCandidate.id,
      username: rawCandidate.username,
      name: rawCandidate.name || rawCandidate.username,
      headline: rawCandidate.headline,
      location: rawCandidate.location,
      field: rawCandidate.field,
      skills: JSON.parse(rawCandidate.skills_json || "[]"),
      entry_count: entriesCount?.count || 0,
      reason: match.reason
    };
  }).filter(Boolean);

  return NextResponse.json(matchedCandidates);
}
