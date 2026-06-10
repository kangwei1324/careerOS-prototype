import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import CompanyProfileClient from "./CompanyProfileClient";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getDb();

  const user = db
    .prepare("SELECT id FROM users WHERE username = ? AND role = 'employer'")
    .get(username) as { id: number } | undefined;

  if (!user) notFound();

  const profile = db
    .prepare(
      "SELECT company_name, industry, location, description, company_description, socials_json FROM employer_profiles WHERE user_id = ?"
    )
    .get(user.id) as any;

  return (
    <CompanyProfileClient
      employerId={user.id}
      username={username}
      profile={{
        company_name: profile?.company_name ?? username,
        industry: profile?.industry ?? "",
        location: profile?.location ?? "",
        description: profile?.description ?? "",
        company_description: profile?.company_description ?? "",
        socials: JSON.parse(profile?.socials_json ?? "{}"),
      }}
    />
  );
}
