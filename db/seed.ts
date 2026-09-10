import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema/index";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding Newberg Tea Centre database...");

  // 1. Categories
  console.log("Creating categories...");
  const cats = [
    { name: "Black Tea", slug: "black-tea", subtitle: "The classic Ceylon experience", description: "Bold, brisk and timeless — Black Ceylon tea is the foundation of the world's finest blends.", displayOrder: 1, isActive: true },
    { name: "Green Tea", slug: "green-tea", subtitle: "Fresh, clean, delicate", description: "Unoxidised leaves that preserve natural freshness, antioxidants and a gentler character.", displayOrder: 2, isActive: true },
    { name: "Specialty Tea", slug: "specialty-tea", subtitle: "Rare, refined, exceptional", description: "Limited harvests, rare tips and artisan processing — the pinnacle of Ceylon tea.", displayOrder: 3, isActive: true },
  ];
  const insertedCats: Record<string, string> = {};
  for (const c of cats) {
    const existing = await db.select().from(schema.categories).where(eq(schema.categories.slug, c.slug));
    if (existing.length) {
      insertedCats[c.slug] = existing[0].id;
    } else {
      const [r] = await db.insert(schema.categories).values(c).returning();
      insertedCats[c.slug] = r.id;
    }
  }

  // 2. Tea Grades
  console.log("Creating tea grades...");
  const grades = [
    { cat: "black-tea", gradeCode: "BOP", name: "Broken Orange Pekoe", slug: "bop", processingMethod: "Orthodox", groupName: "Orthodox", description: "Classic broken leaf that gives a full-bodied, brisk cup with malty depth — bold Ceylon character at its best.", tasteProfile: "Strong · Malty · Brisk", cupColour: "Deep amber", bestFor: "Milk tea & strong brews", availability: "AVAILABLE", isPublished: true, displayOrder: 1, price: 1280 },
    { cat: "black-tea", gradeCode: "BOPF", name: "Broken Orange Pekoe Fannings", slug: "bopf", processingMethod: "Orthodox", groupName: "Orthodox", description: "Smaller particles brew fast and strong with bold colour and a firm bite — the everyday milk-tea champion.", tasteProfile: "Strong · Dark · Quick-brew", cupColour: "Dark ruby", bestFor: "Everyday milk tea", availability: "AVAILABLE", isPublished: true, displayOrder: 2, price: 1210 },
    { cat: "black-tea", gradeCode: "FBOP", name: "Flowery Broken Orange Pekoe", slug: "fbop", processingMethod: "Orthodox", groupName: "Orthodox", description: "Broken leaf with attractive tips, giving a rounded, aromatic liquor and a gentle caramel sweetness.", tasteProfile: "Aromatic · Rounded · Tippy", cupColour: "Bright red-amber", bestFor: "Plain or light milk", availability: "LOW_STOCK", isPublished: true, displayOrder: 3, price: 1460 },
    { cat: "black-tea", gradeCode: "OP", name: "Orange Pekoe", slug: "op", processingMethod: "Orthodox", groupName: "Orthodox", description: "Long, stylish leaf that steeps smooth and elegant — light body with a subtle citrus finish.", tasteProfile: "Smooth · Light · Citrus lift", cupColour: "Golden", bestFor: "Plain sipping", availability: "AVAILABLE", isPublished: true, displayOrder: 4, price: 1390 },
    { cat: "black-tea", gradeCode: "BP1", name: "CTC Broken Pekoe", slug: "bp1", processingMethod: "CTC", groupName: "CTC", description: "CTC granules deliver a strong, thick liquor with fast colour — made for rich, robust brews.", tasteProfile: "Strong · Thick · Bold", cupColour: "Rusty red", bestFor: "Rich milk tea", availability: "AVAILABLE", isPublished: true, displayOrder: 5, price: 1150 },
    { cat: "black-tea", gradeCode: "PF1", name: "CTC Pekoe Fannings", slug: "pf1", processingMethod: "CTC", groupName: "CTC", description: "Small, quick-infusing particles give an extra-strong, dark cup that stands up well to milk.", tasteProfile: "Very strong · Fast colour", cupColour: "Deep mahogany", bestFor: "Strong daily brews", availability: "OUT_OF_STOCK", isPublished: true, displayOrder: 6, price: 1090 },
    { cat: "green-tea", gradeCode: "GP", name: "Gun Powder", slug: "gp", processingMethod: "Green", groupName: "Green", description: "Tightly rolled pearls unfurl into a classic green character — gently smoky with a rounded finish.", tasteProfile: "Smoky · Rounded · Classic", cupColour: "Yellow-green", bestFor: "Plain, light brewing", availability: "AVAILABLE", isPublished: true, displayOrder: 1, price: 1720 },
    { cat: "green-tea", gradeCode: "GP1", name: "Gun Powder 1", slug: "gp1", processingMethod: "Green", groupName: "Green", description: "A higher-grade gunpowder with a smoother, mellower body and soft vegetal notes — easy to love.", tasteProfile: "Smooth · Mellow · Fresh", cupColour: "Light golden-green", bestFor: "Green tea beginners", availability: "AVAILABLE", isPublished: true, displayOrder: 2, price: 1810 },
    { cat: "green-tea", gradeCode: "CH", name: "Chun Mee", slug: "ch", processingMethod: "Green", groupName: "Green", description: "Curved eyebrow leaves brew a smooth, mild liquor with a soft, slightly tangy plum finish.", tasteProfile: "Mild · Smooth · Plum note", cupColour: "Pale yellow", bestFor: "All-day sipping", availability: "AVAILABLE", isPublished: true, displayOrder: 3, price: 1640 },
    { cat: "green-tea", gradeCode: "GT-OP", name: "Green Tea Orange Pekoe", slug: "gt-op", processingMethod: "Green", groupName: "Green", description: "A gentle green tea in OP leaf style — delicate, clean and floral with a whisper of fresh grass.", tasteProfile: "Fresh · Grassy · Floral", cupColour: "Pale gold", bestFor: "Delicate palates", availability: "LOW_STOCK", isPublished: true, displayOrder: 4, price: 1880 },
    { cat: "specialty-tea", gradeCode: "SILVER-TIPS", name: "Silver Tips", slug: "silver-tips", processingMethod: "White Tea", groupName: "White Tea", description: "Hand-picked silvery buds, minimally processed — a subtle, honey-sweet luxury and the lightest cup of all.", tasteProfile: "Delicate · Sweet · Honeyed", cupColour: "Pale straw", bestFor: "Quiet special moments", availability: "AVAILABLE", isPublished: true, displayOrder: 1, price: 6200 },
    { cat: "specialty-tea", gradeCode: "GOLDEN-TIPS", name: "Golden Tips", slug: "golden-tips", processingMethod: "White Tea", groupName: "White Tea", description: "Rare golden buds yield an exceptionally smooth, honeyed liquor — Ceylon's most prestigious cup.", tasteProfile: "Honey-sweet · Silky · Rare", cupColour: "Light gold", bestFor: "Gifting & prestige", availability: "AVAILABLE", isPublished: true, displayOrder: 2, price: 7800 },
  ];

  for (const g of grades) {
    const existing = await db.select().from(schema.teaGrades).where(eq(schema.teaGrades.gradeCode, g.gradeCode));
    if (!existing.length) {
      const [r] = await db.insert(schema.teaGrades).values({
        categoryId: insertedCats[g.cat],
        gradeCode: g.gradeCode,
        name: g.name,
        slug: g.slug,
        processingMethod: g.processingMethod,
        groupName: g.groupName,
        description: g.description,
        tasteProfile: g.tasteProfile,
        cupColour: g.cupColour,
        bestFor: g.bestFor,
        availability: g.availability,
        isPublished: g.isPublished,
        displayOrder: g.displayOrder,
      }).returning();

      // Insert current price
      await db.insert(schema.prices).values({
        teaGradeId: r.id,
        pricePerKg: g.price.toString(),
        currency: "LKR",
        priceBasis: "EX_FACTORY_PER_KG",
        effectiveFrom: new Date(),
        isCurrent: true,
        createdBy: "system-seed",
      });
    }
  }

  // 3. Settings
  console.log("Creating settings...");
  const defaultSettings = [
    { key: "currency", value: "LKR" },
    { key: "priceBasis", value: "EX_FACTORY_PER_KG" },
    { key: "publicDisclaimer", value: "Prices shown are demonstration data for the Newberg Tea Centre website." },
  ];
  for (const s of defaultSettings) {
    const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, s.key));
    if (!existing.length) {
      await db.insert(schema.settings).values(s);
    }
  }

  // 4. Admin user
  console.log("Creating admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@newbergtea.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "NewbergAdmin2026!";
  const adminName = process.env.ADMIN_NAME || "Newberg Admin";
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
  if (!existingUser.length) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(schema.users).values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log("Admin user already exists.");
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
