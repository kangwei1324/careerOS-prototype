import { getDb } from "../lib/db";

async function main() {
  const db = getDb();
  try {
    await db.execute({
      sql: `
        INSERT INTO employer_offers (employer_id, candidate_id, offer_type, field, role_name, job_description, min_salary, max_salary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      args: [
        1,
        2,
        "Interview",
        "Test Field",
        "Test Role",
        "Test Description",
        1000,
        2000
      ]
    });
    console.log("Insert successful!");
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
