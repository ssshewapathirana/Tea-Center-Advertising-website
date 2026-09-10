import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const cats = await db.execute(sql`SELECT name, slug FROM categories ORDER BY display_order`);
  console.log("Categories:", JSON.stringify(cats.rows));

  const grades = await db.execute(sql`SELECT grade_code, name, availability, is_published FROM tea_grades ORDER BY display_order`);
  console.log("Grades:", JSON.stringify(grades.rows));

  const prices = await db.execute(sql`SELECT t.grade_code, p.price_per_kg, p.currency, p.is_current FROM prices p JOIN tea_grades t ON t.id = p.tea_grade_id`);
  console.log("Prices:", JSON.stringify(prices.rows));

  const users = await db.execute(sql`SELECT email, role FROM users`);
  console.log("Users:", JSON.stringify(users.rows));
}

main().catch(console.error);
