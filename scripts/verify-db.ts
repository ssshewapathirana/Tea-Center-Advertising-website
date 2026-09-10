import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Verifying Neon database connection...");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in environment variables.");
    process.exit(1);
  }
  console.log("DATABASE_URL found (masked):", dbUrl.substring(0, 30) + "...");

  try {
    const connectionSql = neon(dbUrl);
    const db = drizzle(connectionSql);

    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("Connection OK:", result.rows);

    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("Tables found:", tables.rows.map((r: any) => r.table_name).join(", "));

    console.log("Database verification passed.");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

main();
