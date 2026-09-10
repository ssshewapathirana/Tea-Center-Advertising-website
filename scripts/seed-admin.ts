import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../db/schema/users";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@newbergtea.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "NewbergAdmin2026!";
  const adminName = process.env.ADMIN_NAME || "Newberg Admin";

  console.log("Seeding admin user:", adminEmail);

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const existing = await db.select().from(users).where(eq(users.email, adminEmail));
  if (existing.length) {
    console.log("Admin user already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(users).values({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "ADMIN",
    isActive: true,
  });

  console.log("Admin user created:", adminEmail);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
