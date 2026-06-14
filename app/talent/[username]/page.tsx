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

  const user = (await db.execute({ sql: "SELECT id FROM users WHERE username = ? AND role = 'candidate'", args: [username] })).rows[0] as unknown as { id: number } | undefined;

  if (!user) notFound();

  const profile = (await db.execute({ sql: "SELECT name, headline, location, field, bio, skills_json, socials_json FROM candidate_profiles WHERE user_id = ?", args: [user.id] })).rows[0] as any;

  const entries = (await db.execute({ sql: `SELECT id, polished_entry, category, entry_date, skills_json, media_json, links_json, pinned_type, pinned_id
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as any[];

  const workExperience = (await db.execute({ sql: `SELECT id, title, company, start_date, end_date, description
       FROM work_experience WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as any[];

  const education = (await db.execute({ sql: `SELECT id, institution, degree, start_date, end_date
       FROM education WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as any[];

  const honours = (await db.execute({ sql: `SELECT id, title, issuer, award_date
       FROM honours_awards WHERE user_id = ?
       ORDER BY award_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as any[];

  const interests = (await db.execute({ sql: `SELECT COUNT(*) as count FROM employer_interests WHERE candidate_id = ?`, args: [user.id] })).rows[0] as unknown as { count: number };

  const session = await getSession();
  let hasInterested = false;
  let hasSentOffer = false;
  if (session && session.role === "employer") {
    const interestRecord = (await db.execute({ sql: "SELECT 1 FROM employer_interests WHERE employer_id = ? AND candidate_id = ?", args: [session.userId, user.id] })).rows[0];
    hasInterested = !!interestRecord;

    const offerRecord = (await db.execute({ sql: "SELECT 1 FROM offers WHERE employer_id = ? AND candidate_id = ?", args: [session.userId, user.id] })).rows[0];
    hasSentOffer = !!offerRecord;
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
      entries={entries.map((e) => ({ 
        ...e, 
        skills: JSON.parse(e.skills_json ?? "[]"),
        media: JSON.parse(e.media_json ?? "[]"),
        links: JSON.parse(e.links_json ?? "[]")
      }))}
      workExperience={workExperience.map(r => ({ ...r }))}
      education={education.map(r => ({ ...r }))}
      honours={honours.map(r => ({ ...r }))}
      interestCount={interests.count}
      initialInterested={hasInterested}
      hasSentOffer={hasSentOffer}
    />
  );
}
