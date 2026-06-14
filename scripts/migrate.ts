import "dotenv/config";
import { initDbSchema } from "../lib/db";

async function main() {
  console.log("Running migrations...");
  await initDbSchema();
  console.log("Migrations complete!");
}

main().catch(console.error);
