import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicPortfolioClient from "./PublicPortfolioClient";
import type { WorkExperience, Education, HonourAward } from "@/lib/types";

interface Entry {
  id: number;
  polished_entry: string;
  category: string;
  entry_date: string;
  skills: string[];
}

interface Profile {
  name: string;
  headline: string;
  location: string;
  field: string;
  bio: string;
  skills: string[];
  userId: number;
}

// Server component — fetch data at request time
export default async function PublicPortfolioPage({
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

  const profileRow = db
    .prepare("SELECT name, headline, location, field, bio, skills_json FROM candidate_profiles WHERE user_id = ?")
    .get(user.id) as any;

  const entries = db
    .prepare(
      `SELECT id, polished_entry, category, entry_date, skills_json
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
    .all(user.id) as WorkExperience[];

  const education = db
    .prepare(
      `SELECT id, institution, degree, start_date, end_date
       FROM education WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`
    )
    .all(user.id) as Education[];

  const honours = db
    .prepare(
      `SELECT id, title, issuer, award_date
       FROM honours_awards WHERE user_id = ?
       ORDER BY award_date DESC, created_at DESC`
    )
    .all(user.id) as HonourAward[];

  const profile: Profile = {
    name: profileRow?.name ?? username,
    headline: profileRow?.headline ?? "",
    location: profileRow?.location ?? "",
    field: profileRow?.field ?? "",
    bio: profileRow?.bio ?? "",
    skills: JSON.parse(profileRow?.skills_json ?? "[]"),
    userId: user.id,
  };

  const formattedEntries: Entry[] = entries.map((e) => ({
    ...e,
    skills: JSON.parse(e.skills_json ?? "[]"),
  }));

  // Union of manually-added profile skills + AI-extracted entry skills
  const allSkills = Array.from(
    new Set([...profile.skills, ...formattedEntries.flatMap((e) => e.skills)])
  );

  return (
    <PublicPortfolioClient
      username={username}
      profile={profile}
      entries={formattedEntries}
      allSkills={allSkills}
      workExperience={workExperience}
      education={education}
      honours={honours}
    />
  );
}
