import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, offerType, field, roleName, minSalary, maxSalary } = await request.json();

    if (!candidateId || !offerType || !field || !roleName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    const insertOffer = db.prepare(`
      INSERT INTO employer_offers (employer_id, candidate_id, offer_type, field, role_name, min_salary, max_salary, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    insertOffer.run(
      session.userId,
      candidateId,
      offerType,
      field,
      roleName,
      minSalary || null,
      maxSalary || null
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
