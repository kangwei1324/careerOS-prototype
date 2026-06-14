import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { rows } = await db.execute({
      sql: `
        SELECT 
          eo.id,
          eo.offer_type,
          eo.field,
          eo.role_name,
          eo.job_description,
          eo.min_salary,
          eo.max_salary,
          eo.status,
          eo.created_at,
          u.username as candidate_username,
          cp.name as candidate_name
        FROM employer_offers eo
        JOIN users u ON eo.candidate_id = u.id
        LEFT JOIN candidate_profiles cp ON eo.candidate_id = cp.user_id
        WHERE eo.employer_id = ?
        ORDER BY eo.created_at DESC
      `,
      args: [session.userId],
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching sent offers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
