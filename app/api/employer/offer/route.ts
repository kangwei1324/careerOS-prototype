import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, offerType, field, roleName, jobDescription, minSalary, maxSalary } = await request.json();

    if (!candidateId || !offerType || !field || !roleName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: `
        INSERT INTO employer_offers (employer_id, candidate_id, offer_type, field, role_name, job_description, min_salary, max_salary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      args: [
        session.userId,
        candidateId,
        offerType,
        field,
        roleName,
        jobDescription || "",
        minSalary || null,
        maxSalary || null
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
