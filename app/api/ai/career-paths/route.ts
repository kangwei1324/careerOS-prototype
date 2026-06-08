import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateCareerPaths } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { currentRole, field, yearsExperience, skills, optimiseFor } = body;

  if (!currentRole || !field) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const paths = await generateCareerPaths({
      currentRole,
      field,
      yearsExperience: Number(yearsExperience) || 0,
      skills: Array.isArray(skills) ? skills : [],
      optimiseFor: optimiseFor || "growth",
    });
    return NextResponse.json({ paths });
  } catch (err) {
    console.error("[ai/career-paths]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
