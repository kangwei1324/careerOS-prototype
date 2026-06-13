import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/auth/me — returns current session + profile info
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const db = getDb();
  let name = "";

  if (session.role === "candidate") {
    const profile = (await db.execute({ sql: "SELECT name FROM candidate_profiles WHERE user_id = ?", args: [session.userId] })).rows[0] as unknown as { name: string } | undefined;
    name = profile?.name ?? "";
  } else {
    const profile = (await db.execute({ sql: "SELECT company_name FROM employer_profiles WHERE user_id = ?", args: [session.userId] })).rows[0] as unknown as { company_name: string } | undefined;
    name = profile?.company_name ?? "";
  }

  return NextResponse.json({
    user: { ...session, name },
  });
}
