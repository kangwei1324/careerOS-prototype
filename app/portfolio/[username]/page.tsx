import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicPortfolioClient from "./PublicPortfolioClient";
import type { PortfolioEntry, WorkExperience, Education, HonourAward } from "@/lib/types";


interface Profile {
  name: string;
  headline: string;
  location: string;
  field: string;
  bio: string;
  skills: string[];
  userId: number;
  socials?: {
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

// Server component — fetch data at request time
export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getDb();

  const user = (await db.execute({ sql: "SELECT id FROM users WHERE username = ? AND role = 'candidate'", args: [username] })).rows[0] as unknown as { id: number } | undefined;

  if (!user) notFound();

  const profileRow = (await db.execute({ sql: "SELECT name, headline, location, field, bio, skills_json, socials_json FROM candidate_profiles WHERE user_id = ?", args: [user.id] })).rows[0] as any;

  const entries = (await db.execute({ sql: `SELECT id, polished_entry, category, entry_date, skills_json, media_json, links_json, pinned_type, pinned_id
       FROM portfolio_entries
       WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as any[];

  const workExperience = (await db.execute({ sql: `SELECT id, title, company, start_date, end_date, description
       FROM work_experience WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as WorkExperience[];

  const education = (await db.execute({ sql: `SELECT id, institution, degree, start_date, end_date
       FROM education WHERE user_id = ?
       ORDER BY start_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as Education[];

  const honours = (await db.execute({ sql: `SELECT id, title, issuer, award_date
       FROM honours_awards WHERE user_id = ?
       ORDER BY award_date DESC, created_at DESC`, args: [user.id] })).rows as unknown as HonourAward[];

  const profile: Profile = {
    name: profileRow?.name ?? username,
    headline: profileRow?.headline ?? "",
    location: profileRow?.location ?? "",
    field: profileRow?.field ?? "",
    bio: profileRow?.bio ?? "",
    skills: JSON.parse(profileRow?.skills_json ?? "[]"),
    socials: JSON.parse(profileRow?.socials_json ?? "{}"),
    userId: user.id,
  };

  const formattedEntries: PortfolioEntry[] = entries.map((e) => ({
    ...e,
    skills:      JSON.parse(e.skills_json ?? "[]"),
    media:       JSON.parse(e.media_json  ?? "[]"),
    links:       JSON.parse(e.links_json  ?? "[]"),
    pinned_type: e.pinned_type ?? undefined,
    pinned_id:   e.pinned_id   ?? undefined,
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
      workExperience={workExperience.map(r => ({ ...r }))}
      education={education.map(r => ({ ...r }))}
      honours={honours.map(r => ({ ...r }))}
    />
  );
}
