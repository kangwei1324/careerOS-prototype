import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { suggestCandidates } from "@/lib/gemini";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  const db = getDb();

  // 1. Get the current employer's profile description
  const employer = (await db.execute({ sql: "SELECT description FROM employer_profiles WHERE user_id = ?", args: [session.userId] })).rows[0] as unknown as { description: string } | undefined;

  if (!employer || !employer.description.trim()) {
    return NextResponse.json([]); // Return empty if search requirements are empty
  }

  // 2. Check if we have cached suggestions for the same description
  const descHash = crypto.createHash("md5").update(employer.description.trim()).digest("hex");

  interface CachedSuggestionRow {
    candidate_id: number;
    reason: string;
    username: string;
    name: string | null;
    headline: string | null;
    location: string | null;
    field: string | null;
    skills_json: string | null;
  }

  const cached = (await db.execute({ sql: `
    SELECT s.candidate_id, s.reason,
           u.username, cp.name, cp.headline, cp.location, cp.field, cp.skills_json
    FROM ai_suggestions s
    JOIN users u ON u.id = s.candidate_id
    JOIN candidate_profiles cp ON cp.user_id = s.candidate_id
    WHERE s.employer_id = ? AND s.description_hash = ?
    ORDER BY s.id ASC
  `, args: [session.userId, descHash] })).rows as unknown as CachedSuggestionRow[];

  if (!forceRefresh && cached.length > 0) {
    // Return cached results with enriched profile data
    const results = await Promise.all(cached.map(async (c) => {
      const entriesCount = (await db.execute({ sql: "SELECT COUNT(*) as count FROM portfolio_entries WHERE user_id = ?", args: [c.candidate_id] })).rows[0] as unknown as { count: number };

      return {
        id: c.candidate_id,
        username: c.username,
        name: c.name || c.username,
        headline: c.headline,
        location: c.location,
        field: c.field,
        skills: JSON.parse(c.skills_json || "[]"),
        entry_count: entriesCount?.count || 0,
        reason: c.reason,
      };
    }));
    return NextResponse.json(results);
  }

  // 3. No cache — query all candidates and their profiles
  interface CandidateRawRow {
    id: number;
    username: string;
    name: string | null;
    headline: string | null;
    location: string | null;
    field: string | null;
    skills_json: string | null;
    bio: string | null;
  }

  const candidatesRaw = (await db.execute(`
    SELECT
      u.id, u.username,
      cp.name, cp.headline, cp.location, cp.field,
      cp.skills_json, cp.bio
    FROM users u
    JOIN candidate_profiles cp ON cp.user_id = u.id
    WHERE u.role = 'candidate'
  `)).rows as unknown as CandidateRawRow[];

  if (candidatesRaw.length === 0) {
    return NextResponse.json([]);
  }

  // 4. For each candidate, fetch recent portfolio logs and section data to build a summary
  const candidatesForAi = await Promise.all(candidatesRaw.map(async (c) => {
    const entries = (await db.execute({ sql: `
      SELECT polished_entry, category
      FROM portfolio_entries
      WHERE user_id = ?
      ORDER BY entry_date DESC
      LIMIT 6
    `, args: [c.id] })).rows as unknown as Array<{ polished_entry: string; category: string }>;

    const portfolioSummary = entries.map((e) => `[${e.category}] ${e.polished_entry}`).join("; ");

    const workExperience = (await db.execute({ sql: `
      SELECT title, company, start_date, end_date, description
      FROM work_experience
      WHERE user_id = ?
      ORDER BY start_date DESC
    `, args: [c.id] })).rows as unknown as Array<{ title: string; company: string; start_date: string; end_date: string | null; description: string }>;

    const education = (await db.execute({ sql: `
      SELECT institution, degree, start_date, end_date
      FROM education
      WHERE user_id = ?
      ORDER BY start_date DESC
    `, args: [c.id] })).rows as unknown as Array<{ institution: string; degree: string; start_date: string; end_date: string | null }>;

    const awards = (await db.execute({ sql: `
      SELECT title, issuer, award_date
      FROM honours_awards
      WHERE user_id = ?
      ORDER BY award_date DESC
    `, args: [c.id] })).rows as unknown as Array<{ title: string; issuer: string; award_date: string }>;

    return {
      id: c.id,
      name: c.name || c.username,
      headline: c.headline || "",
      location: c.location || "",
      field: c.field || "",
      skills: JSON.parse(c.skills_json || "[]") as string[],
      bio: c.bio || "",
      portfolio_summary: portfolioSummary || "No portfolio entries yet.",
      work_experience: workExperience,
      education,
      awards
    };
  }));

  // 5. Send to Gemini for ranking and reasons
  let aiMatches = await suggestCandidates(employer.description, candidatesForAi);

  // Fallback if AI fails or returns empty array
  if (aiMatches.length === 0 && candidatesForAi.length > 0) {
    console.warn("[suggestions/route] AI returned 0 matches, using fallback suggestions.");
    aiMatches = candidatesForAi.slice(0, 3).map((c) => ({
      id: c.id,
      reason: "Suggested based on general profile availability (AI match failed or found no strict fit)."
    }));
  }

  // 6. Save results to cache
  //    First clear old suggestions for this employer
  await db.execute({ sql: "DELETE FROM ai_suggestions WHERE employer_id = ?", args: [session.userId] });

  for (const match of aiMatches) {
    await db.execute({
      sql: `INSERT INTO ai_suggestions (employer_id, candidate_id, reason, description_hash) VALUES (?, ?, ?, ?)`,
      args: [session.userId, match.id, match.reason, descHash]
    });
  }

  // 7. Build full profiles response for recommended matches
  const matchedCandidates = (await Promise.all(aiMatches.map(async (match) => {
    const rawCandidate = candidatesRaw.find((c) => c.id === match.id);
    if (!rawCandidate) return null;

    // Get count of portfolio entries
    const entriesCount = (await db.execute({ sql: "SELECT COUNT(*) as count FROM portfolio_entries WHERE user_id = ?", args: [rawCandidate.id] })).rows[0] as unknown as { count: number };

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
  }))).filter(Boolean);

  return NextResponse.json(matchedCandidates);
}
