import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicPortfolioClient from "./PublicPortfolioClient";

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

  // All skills from entries
  const allEntrySkills = Array.from(
    new Set(formattedEntries.flatMap((e) => e.skills))
  );

  return (
    <PublicPortfolioClient
      username={username}
      profile={profile}
      entries={formattedEntries}
      allSkills={allEntrySkills}
    />
  );
}
