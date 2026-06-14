import { getDb, initDbSchema } from "../lib/db";

async function main() {
  const db = getDb();
  try {
    const res = await db.execute("PRAGMA table_info(employer_offers);");
    console.log("Table info:", res.rows);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
