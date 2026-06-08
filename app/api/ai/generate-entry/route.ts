import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generatePortfolioEntry } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { raw_log, category, entry_date } = await req.json();

  if (!raw_log) {
    return NextResponse.json({ error: "raw_log is required" }, { status: 400 });
  }

  try {
    const result = await generatePortfolioEntry(
      raw_log,
      category ?? "Other",
      entry_date ?? new Date().toISOString().split("T")[0]
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/generate-entry]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
