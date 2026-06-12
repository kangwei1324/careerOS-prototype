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
      `SELECT id, polished_entry, category, entry_date, skills_json, media_json, links_json, pinned_type, pinned_id
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC`
    )
    .all(user.id) as any[];

  const workExperience = db
    .prepare(
      `SELECT id, title, company, start_date, end_date, description
       FROM work_experience WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`
    )
    .all(user.id) as any[];

  const education = db
    .prepare(
      `SELECT id, institution, degree, start_date, end_date
       FROM education WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`
    )
    .all(user.id) as any[];

  const honours = db
    .prepare(
      `SELECT id, title, issuer, award_date
       FROM honours_awards WHERE user_id = ?
       ORDER BY award_date DESC, created_at DESC`
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
      entries={entries.map((e) => ({ 
        ...e, 
        skills: JSON.parse(e.skills_json ?? "[]"),
        media: JSON.parse(e.media_json ?? "[]"),
        links: JSON.parse(e.links_json ?? "[]")
      }))}
      workExperience={workExperience}
      education={education}
      honours={honours}
      interestCount={interests.count}
      initialInterested={hasInterested}
    />
  );
}

