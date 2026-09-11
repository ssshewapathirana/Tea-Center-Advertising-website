import { Router } from "express";
import type { Request, Response } from "express";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, asc, sql, ilike, or } from "drizzle-orm";
import { categories } from "../../db/schema/categories.js";
import { teaGrades } from "../../db/schema/tea-grades.js";
import { prices } from "../../db/schema/prices.js";

const router = Router();
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return drizzle(neon(databaseUrl));
}

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch categories" } });
  }
});

router.get("/grades", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { category, search } = req.query;
    const conditions = [eq(teaGrades.isPublished, true)];
    if (typeof category === "string") conditions.push(eq(categories.slug, category));
    if (typeof search === "string") {
      const q = `%${search}%`;
      conditions.push(or(ilike(teaGrades.gradeCode, q), ilike(teaGrades.name, q), ilike(teaGrades.description, q), ilike(teaGrades.tasteProfile, q), ilike(teaGrades.processingMethod, q))!);
    }
    const result = await db.select({
      id: teaGrades.id, gradeCode: teaGrades.gradeCode, name: teaGrades.name, slug: teaGrades.slug,
      processingMethod: teaGrades.processingMethod, groupName: teaGrades.groupName, description: teaGrades.description,
      tasteProfile: teaGrades.tasteProfile, cupColour: teaGrades.cupColour, bestFor: teaGrades.bestFor,
      availability: teaGrades.availability, displayOrder: teaGrades.displayOrder,
      categoryId: categories.id, categoryName: categories.name, categorySlug: categories.slug,
      pricePerKg: prices.pricePerKg, currency: prices.currency,
    }).from(teaGrades)
      .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
      .innerJoin(prices, and(eq(prices.teaGradeId, teaGrades.id), eq(prices.isCurrent, true)))
      .where(and(...conditions)).orderBy(asc(teaGrades.displayOrder));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching grades:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch grades" } });
  }
});

router.get("/grades/:slug", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const slug = String(req.params.slug);
    const result = await db.select({
      id: teaGrades.id, gradeCode: teaGrades.gradeCode, name: teaGrades.name, slug: teaGrades.slug,
      processingMethod: teaGrades.processingMethod, groupName: teaGrades.groupName, description: teaGrades.description,
      tasteProfile: teaGrades.tasteProfile, cupColour: teaGrades.cupColour, bestFor: teaGrades.bestFor,
      categoryName: categories.name, categorySlug: categories.slug, pricePerKg: prices.pricePerKg, currency: prices.currency,
    }).from(teaGrades)
      .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
      .innerJoin(prices, and(eq(prices.teaGradeId, teaGrades.id), eq(prices.isCurrent, true)))
      .where(and(eq(teaGrades.slug, slug), eq(teaGrades.isPublished, true)));
    if (!result.length) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }
    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error("Error fetching grade:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch grade" } });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const gradesResult = await db.execute(sql`SELECT COUNT(*) as count FROM tea_grades WHERE is_published = true`);
    const minPrice = await db.execute(sql`SELECT MIN(p.price_per_kg) as min_price FROM prices p JOIN tea_grades t ON t.id = p.tea_grade_id WHERE t.is_published = true AND p.is_current = true`);
    const avgPrice = await db.execute(sql`SELECT AVG(p.price_per_kg) as avg_price FROM prices p JOIN tea_grades t ON t.id = p.tea_grade_id WHERE t.is_published = true AND p.is_current = true`);
    res.json({ success: true, data: { totalGrades: Number(gradesResult.rows[0]?.count) || 0, minPrice: Number(minPrice.rows[0]?.min_price) || 0, avgPrice: Number(avgPrice.rows[0]?.avg_price) || 0 } });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch stats" } });
  }
});

export default router;
