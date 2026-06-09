import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import TalentProfileClient from "./TalentProfileClient";

export default async function TalentProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getDb();

  const user = db
    .prepare("SELECT id FROM users WHERE username = ? AND role = 'candidate'")
    .get(username) as { id: number } | undefined;

  if (!user) notFound();

  const profile = db
    .prepare(
      "SELECT name, headline, location, field, bio, skills_json, socials_json FROM candidate_profiles WHERE user_id = ?"
    )
    .get(user.id) as any;

  const entries = db
    .prepare(
      `SELECT id, polished_entry, category, entry_date, skills_json
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC`
    )
    .all(user.id) as any[];

  const interests = db
    .prepare(
      `SELECT COUNT(*) as count FROM employer_interests WHERE candidate_id = ?`
    )
    .get(user.id) as { count: number };

  const session = await getSession();
  let hasInterested = false;
  if (session && session.role === "employer") {
    const interestRecord = db
      .prepare(
        "SELECT 1 FROM employer_interests WHERE employer_id = ? AND candidate_id = ?"
      )
      .get(session.userId, user.id);
    hasInterested = !!interestRecord;
  }

  return (
    <TalentProfileClient
      candidateId={user.id}
      username={username}
      profile={{
        name: profile?.name ?? username,
        headline: profile?.headline ?? "",
        location: profile?.location ?? "",
        field: profile?.field ?? "",
        bio: profile?.bio ?? "",
        skills: JSON.parse(profile?.skills_json ?? "[]"),
        socials: JSON.parse(profile?.socials_json ?? "{}"),
      }}
      entries={entries.map((e) => ({ ...e, skills: JSON.parse(e.skills_json ?? "[]") }))}
      interestCount={interests.count}
      initialInterested={hasInterested}
    />
  );
}
