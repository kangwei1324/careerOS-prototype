import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateBio } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const profile = (await db.execute({ sql: "SELECT name FROM candidate_profiles WHERE user_id = ?", args: [session.userId] })).rows[0] as unknown as { name: string } | undefined;

  const entries = (await db.execute({ sql: "SELECT polished_entry, category FROM portfolio_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 10", args: [session.userId] })).rows as unknown as Array<{ polished_entry: string; category: string }>;

  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries to generate bio from" }, { status: 400 });
  }

  try {
    const bio = await generateBio(profile?.name ?? session.username, entries);

    // Save bio to profile
    await db.execute({ sql: "UPDATE candidate_profiles SET bio = ?, updated_at = datetime('now') WHERE user_id = ?", args: [bio, session.userId] });

    return NextResponse.json({ bio });
  } catch (err) {
    console.error("[ai/generate-bio]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
