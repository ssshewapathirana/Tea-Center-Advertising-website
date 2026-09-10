import { Router, Request, Response } from "express";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, asc, desc, sql, ilike, or, between, gte, lte } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middleware/auth";
import { categories } from "../../db/schema/categories";
import { teaGrades } from "../../db/schema/tea-grades";
import { prices } from "../../db/schema/prices";
import { priceHistory } from "../../db/schema/price-history";
import { activityLogs } from "../../db/schema/activity-logs";
import { users } from "../../db/schema/users";
import { settings } from "../../db/schema/settings";
import { images } from "../../db/schema/images";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!));
}

// ============ DASHBOARD ============

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const [totalGrades, publishedGrades, availableGrades, lowStockGrades, outOfStockGrades, totalCategories] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as c FROM tea_grades`),
      db.execute(sql`SELECT COUNT(*) as c FROM tea_grades WHERE is_published = true`),
      db.execute(sql`SELECT COUNT(*) as c FROM tea_grades WHERE availability = 'AVAILABLE'`),
      db.execute(sql`SELECT COUNT(*) as c FROM tea_grades WHERE availability = 'LOW_STOCK'`),
      db.execute(sql`SELECT COUNT(*) as c FROM tea_grades WHERE availability = 'OUT_OF_STOCK'`),
      db.execute(sql`SELECT COUNT(*) as c FROM categories WHERE is_active = true`),
    ]);

    const avgPrice = await db.execute(sql`SELECT AVG(p.price_per_kg) as avg FROM prices p WHERE p.is_current = true`);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const priceChangesWeek = await db.execute(sql`SELECT COUNT(*) as c FROM price_history WHERE created_at >= ${weekAgo}`);

    const recentPriceChanges = await db.execute(sql`
      SELECT ph.*, t.grade_code, t.name as tea_name
      FROM price_history ph
      JOIN tea_grades t ON t.id = ph.tea_grade_id
      ORDER BY ph.created_at DESC LIMIT 5
    `);

    const recentActivity = await db.execute(sql`
      SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalGrades: Number(totalGrades.rows[0]?.c) || 0,
          published: Number(publishedGrades.rows[0]?.c) || 0,
          available: Number(availableGrades.rows[0]?.c) || 0,
          lowStock: Number(lowStockGrades.rows[0]?.c) || 0,
          outOfStock: Number(outOfStockGrades.rows[0]?.c) || 0,
          totalCategories: Number(totalCategories.rows[0]?.c) || 0,
          avgPrice: Number(avgPrice.rows[0]?.avg) || 0,
          priceChangesWeek: Number(priceChangesWeek.rows[0]?.c) || 0,
        },
        recentPriceChanges: recentPriceChanges.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load dashboard" } });
  }
});

// ============ TEA CATALOGUE ============

router.get("/tea", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { category, availability, published, method, search, sort } = req.query;
    const conditions = [];
    if (category && typeof category === "string") conditions.push(eq(categories.slug, category));
    if (availability && typeof availability === "string") conditions.push(eq(teaGrades.availability, availability));
    if (published && typeof published === "string") conditions.push(eq(teaGrades.isPublished, published === "true"));
    if (method && typeof method === "string") conditions.push(eq(teaGrades.processingMethod, method));
    if (search && typeof search === "string") {
      const q = `%${search}%`;
      conditions.push(or(ilike(teaGrades.gradeCode, q), ilike(teaGrades.name, q), ilike(teaGrades.description, q))!);
    }

    let orderBy;
    switch (sort) {
      case "price-asc": orderBy = asc(prices.pricePerKg); break;
      case "price-desc": orderBy = desc(prices.pricePerKg); break;
      case "name": orderBy = asc(teaGrades.gradeCode); break;
      case "updated": orderBy = desc(teaGrades.updatedAt); break;
      default: orderBy = asc(teaGrades.displayOrder);
    }

    const result = await db
      .select({
        id: teaGrades.id,
        gradeCode: teaGrades.gradeCode,
        name: teaGrades.name,
        slug: teaGrades.slug,
        processingMethod: teaGrades.processingMethod,
        groupName: teaGrades.groupName,
        description: teaGrades.description,
        tasteProfile: teaGrades.tasteProfile,
        cupColour: teaGrades.cupColour,
        bestFor: teaGrades.bestFor,
        availability: teaGrades.availability,
        isPublished: teaGrades.isPublished,
        displayOrder: teaGrades.displayOrder,
        updatedAt: teaGrades.updatedAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryId: teaGrades.categoryId,
        pricePerKg: prices.pricePerKg,
        currency: prices.currency,
      })
      .from(teaGrades)
      .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
      .leftJoin(prices, and(eq(prices.teaGradeId, teaGrades.id), eq(prices.isCurrent, true)))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderBy);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Tea list error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to list teas" } });
  }
});

const teaSchema = z.object({
  categoryId: z.string().uuid(),
  gradeCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  processingMethod: z.string().min(1).max(100),
  groupName: z.string().min(1).max(100),
  description: z.string().optional(),
  tasteProfile: z.string().optional(),
  cupColour: z.string().optional(),
  bestFor: z.string().optional(),
  availability: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"]).default("AVAILABLE"),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  initialPrice: z.number().positive().optional(),
});

router.post("/tea", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const parsed = teaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid tea data", details: parsed.error.flatten() } });
      return;
    }
    const db = getDb();
    const d = parsed.data;

    // Check unique grade code
    const existing = await db.select().from(teaGrades).where(eq(teaGrades.gradeCode, d.gradeCode));
    if (existing.length) {
      res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Grade code already exists" } });
      return;
    }

    const [tea] = await db.insert(teaGrades).values({
      categoryId: d.categoryId,
      gradeCode: d.gradeCode,
      name: d.name,
      slug: d.slug,
      processingMethod: d.processingMethod,
      groupName: d.groupName,
      description: d.description,
      tasteProfile: d.tasteProfile,
      cupColour: d.cupColour,
      bestFor: d.bestFor,
      availability: d.availability,
      isPublished: d.isPublished,
      displayOrder: d.displayOrder,
    }).returning();

    if (d.initialPrice) {
      await db.insert(prices).values({
        teaGradeId: tea.id,
        pricePerKg: d.initialPrice.toString(),
        isCurrent: true,
        createdBy: req.user?.email,
      });
    }

    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "CREATE_TEA",
      entityType: "tea_grade",
      entityId: tea.id,
      description: `Created tea grade ${d.gradeCode} (${d.name})`,
    });

    res.json({ success: true, data: tea });
  } catch (err) {
    console.error("Create tea error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create tea" } });
  }
});

router.get("/tea/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db
      .select({
        id: teaGrades.id,
        gradeCode: teaGrades.gradeCode,
        name: teaGrades.name,
        slug: teaGrades.slug,
        processingMethod: teaGrades.processingMethod,
        groupName: teaGrades.groupName,
        description: teaGrades.description,
        tasteProfile: teaGrades.tasteProfile,
        cupColour: teaGrades.cupColour,
        bestFor: teaGrades.bestFor,
        availability: teaGrades.availability,
        isPublished: teaGrades.isPublished,
        displayOrder: teaGrades.displayOrder,
        createdAt: teaGrades.createdAt,
        updatedAt: teaGrades.updatedAt,
        categoryId: categories.id,
        categoryName: categories.name,
        pricePerKg: prices.pricePerKg,
      })
      .from(teaGrades)
      .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
      .leftJoin(prices, and(eq(prices.teaGradeId, teaGrades.id), eq(prices.isCurrent, true)))
      .where(eq(teaGrades.id, req.params.id));

    if (!result.length) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }
    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error("Get tea error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to get tea" } });
  }
});

router.put("/tea/:id", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const parsed = teaSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid tea data", details: parsed.error.flatten() } });
      return;
    }
    const db = getDb();
    const d = parsed.data;

    const [updated] = await db.update(teaGrades)
      .set({ ...d, updatedAt: new Date() })
      .where(eq(teaGrades.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }

    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_TEA",
      entityType: "tea_grade",
      entityId: req.params.id,
      description: `Updated tea grade ${updated.gradeCode}`,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update tea error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update tea" } });
  }
});

router.delete("/tea/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const [deleted] = await db.delete(teaGrades).where(eq(teaGrades.id, req.params.id)).returning();
    if (!deleted) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "DELETE_TEA",
      entityType: "tea_grade",
      entityId: req.params.id,
      description: `Deleted tea grade ${deleted.gradeCode}`,
    });
    res.json({ success: true, data: { message: "Tea grade deleted" } });
  } catch (err) {
    console.error("Delete tea error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete tea" } });
  }
});

// ============ AVAILABILITY ============

router.patch("/tea/:id/availability", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const schema = z.object({ availability: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid availability value" } });
      return;
    }
    const db = getDb();
    const [updated] = await db.update(teaGrades)
      .set({ availability: parsed.data.availability, updatedAt: new Date() })
      .where(eq(teaGrades.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_AVAILABILITY",
      entityType: "tea_grade",
      entityId: req.params.id,
      description: `Updated ${updated.gradeCode} availability to ${parsed.data.availability}`,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update availability error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update availability" } });
  }
});

// ============ PUBLICATION ============

router.patch("/tea/:id/publish", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const schema = z.object({ isPublished: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid publication value" } });
      return;
    }
    const db = getDb();
    const [updated] = await db.update(teaGrades)
      .set({ isPublished: parsed.data.isPublished, updatedAt: new Date() })
      .where(eq(teaGrades.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Tea grade not found" } });
      return;
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: parsed.data.isPublished ? "PUBLISH_TEA" : "UNPUBLISH_TEA",
      entityType: "tea_grade",
      entityId: req.params.id,
      description: `${parsed.data.isPublished ? "Published" : "Unpublished"} tea grade ${updated.gradeCode}`,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update publication" } });
  }
});

// ============ CATEGORIES ============

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db.select().from(categories).orderBy(asc(categories.displayOrder));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Categories error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch categories" } });
  }
});

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.post("/categories", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid category data", details: parsed.error.flatten() } });
      return;
    }
    const db = getDb();
    const [cat] = await db.insert(categories).values(parsed.data).returning();
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "CREATE_CATEGORY",
      entityType: "category",
      entityId: cat.id,
      description: `Created category ${cat.name}`,
    });
    res.json({ success: true, data: cat });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create category" } });
  }
});

router.put("/categories/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid category data" } });
      return;
    }
    const db = getDb();
    const [updated] = await db.update(categories)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Category not found" } });
      return;
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_CATEGORY",
      entityType: "category",
      entityId: req.params.id,
      description: `Updated category ${updated.name}`,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update category" } });
  }
});

// ============ PRICES ============

router.get("/prices", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { teaId } = req.query;
    const conditions = [eq(prices.isCurrent, true)];
    if (teaId && typeof teaId === "string") conditions.push(eq(prices.teaGradeId, teaId));

    const result = await db
      .select({
        id: prices.id,
        teaGradeId: prices.teaGradeId,
        pricePerKg: prices.pricePerKg,
        currency: prices.currency,
        effectiveFrom: prices.effectiveFrom,
        gradeCode: teaGrades.gradeCode,
        name: teaGrades.name,
      })
      .from(prices)
      .innerJoin(teaGrades, eq(prices.teaGradeId, teaGrades.id))
      .where(and(...conditions));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Prices error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch prices" } });
  }
});

const priceUpdateSchema = z.object({
  teaGradeId: z.string().uuid(),
  newPrice: z.number().positive(),
  effectiveFrom: z.string().optional(),
  reason: z.string().optional(),
});

router.post("/prices", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const parsed = priceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid price data", details: parsed.error.flatten() } });
      return;
    }
    const db = getDb();
    const d = parsed.data;

    // Get current price
    const currentResult = await db.select().from(prices).where(and(eq(prices.teaGradeId, d.teaGradeId), eq(prices.isCurrent, true)));
    const currentPrice = currentResult.length ? Number(currentResult[0].pricePerKg) : 0;

    // Close previous current price
    if (currentResult.length) {
      await db.update(prices).set({ isCurrent: false }).where(eq(prices.id, currentResult[0].id));
    }

    // Create new price
    const effectiveDate = d.effectiveFrom ? new Date(d.effectiveFrom) : new Date();
    const [newPrice] = await db.insert(prices).values({
      teaGradeId: d.teaGradeId,
      pricePerKg: d.newPrice.toString(),
      effectiveFrom: effectiveDate,
      isCurrent: true,
      createdBy: req.user?.email,
    }).returning();

    // Calculate percentage change
    const pctChange = currentPrice > 0 ? ((d.newPrice - currentPrice) / currentPrice * 100) : 0;

    // Create price history
    await db.insert(priceHistory).values({
      teaGradeId: d.teaGradeId,
      oldPrice: currentResult.length ? currentResult[0].pricePerKg : "0",
      newPrice: d.newPrice.toString(),
      percentageChange: pctChange.toFixed(2),
      effectiveFrom: effectiveDate,
      changedBy: req.user?.email,
      reason: d.reason,
    });

    // Activity log
    const gradeInfo = await db.select().from(teaGrades).where(eq(teaGrades.id, d.teaGradeId));
    const gradeName = gradeInfo.length ? gradeInfo[0].gradeCode : d.teaGradeId;
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_PRICE",
      entityType: "tea_grade",
      entityId: d.teaGradeId,
      description: `Updated ${gradeName} price from Rs. ${currentPrice} to Rs. ${d.newPrice} (${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}%)`,
    });

    res.json({ success: true, data: { price: newPrice, previousPrice: currentPrice, percentageChange: pctChange } });
  } catch (err) {
    console.error("Price update error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update price" } });
  }
});

// ============ BULK PRICE UPDATE ============

const bulkPriceSchema = z.object({
  teaGradeIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(["increase_percent", "decrease_percent", "increase_fixed", "decrease_fixed"]),
  value: z.number().positive(),
  reason: z.string().optional(),
});

router.post("/prices/bulk", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const parsed = bulkPriceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid bulk price data", details: parsed.error.flatten() } });
      return;
    }
    const db = getDb();
    const d = parsed.data;
    const results = [];

    for (const teaGradeId of d.teaGradeIds) {
      const currentResult = await db.select().from(prices).where(and(eq(prices.teaGradeId, teaGradeId), eq(prices.isCurrent, true)));
      if (!currentResult.length) continue;

      const currentPrice = Number(currentResult[0].pricePerKg);
      let newPrice: number;

      switch (d.operation) {
        case "increase_percent": newPrice = currentPrice * (1 + d.value / 100); break;
        case "decrease_percent": newPrice = currentPrice * (1 - d.value / 100); break;
        case "increase_fixed": newPrice = currentPrice + d.value; break;
        case "decrease_fixed": newPrice = currentPrice - d.value; break;
      }

      if (newPrice < 0) newPrice = 0;
      newPrice = Math.round(newPrice * 100) / 100;

      // Close previous
      await db.update(prices).set({ isCurrent: false }).where(eq(prices.id, currentResult[0].id));

      // Create new
      await db.insert(prices).values({
        teaGradeId,
        pricePerKg: newPrice.toString(),
        isCurrent: true,
        createdBy: req.user?.email,
      });

      const pctChange = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice * 100) : 0;

      // History
      await db.insert(priceHistory).values({
        teaGradeId,
        oldPrice: currentResult[0].pricePerKg,
        newPrice: newPrice.toString(),
        percentageChange: pctChange.toFixed(2),
        changedBy: req.user?.email,
        reason: d.reason || `Bulk update: ${d.operation} ${d.value}`,
      });

      const gradeInfo = await db.select().from(teaGrades).where(eq(teaGrades.id, teaGradeId));
      results.push({ teaGradeId, gradeCode: gradeInfo[0]?.gradeCode, previousPrice: currentPrice, newPrice, percentageChange: pctChange });
    }

    // Activity log
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "BULK_PRICE_UPDATE",
      entityType: "tea_grade",
      entityId: d.teaGradeIds.join(","),
      description: `Bulk updated ${d.teaGradeIds.length} tea prices (${d.operation} ${d.value})`,
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Bulk price error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update prices" } });
  }
});

// ============ PRICE HISTORY ============

router.get("/prices/history", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { teaId, category } = req.query;
    const conditions = [];
    if (teaId && typeof teaId === "string") conditions.push(eq(priceHistory.teaGradeId, teaId));

    let result;
    if (category && typeof category === "string") {
      result = await db
        .select({
          id: priceHistory.id,
          teaGradeId: priceHistory.teaGradeId,
          oldPrice: priceHistory.oldPrice,
          newPrice: priceHistory.newPrice,
          percentageChange: priceHistory.percentageChange,
          currency: priceHistory.currency,
          effectiveFrom: priceHistory.effectiveFrom,
          changedBy: priceHistory.changedBy,
          reason: priceHistory.reason,
          createdAt: priceHistory.createdAt,
          gradeCode: teaGrades.gradeCode,
          teaName: teaGrades.name,
          categoryName: categories.name,
        })
        .from(priceHistory)
        .innerJoin(teaGrades, eq(priceHistory.teaGradeId, teaGrades.id))
        .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
        .where(and(eq(categories.slug, category), ...conditions))
        .orderBy(desc(priceHistory.createdAt));
    } else {
      result = await db
        .select({
          id: priceHistory.id,
          teaGradeId: priceHistory.teaGradeId,
          oldPrice: priceHistory.oldPrice,
          newPrice: priceHistory.newPrice,
          percentageChange: priceHistory.percentageChange,
          currency: priceHistory.currency,
          effectiveFrom: priceHistory.effectiveFrom,
          changedBy: priceHistory.changedBy,
          reason: priceHistory.reason,
          createdAt: priceHistory.createdAt,
          gradeCode: teaGrades.gradeCode,
          teaName: teaGrades.name,
          categoryName: categories.name,
        })
        .from(priceHistory)
        .innerJoin(teaGrades, eq(priceHistory.teaGradeId, teaGrades.id))
        .innerJoin(categories, eq(teaGrades.categoryId, categories.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(priceHistory.createdAt));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Price history error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch price history" } });
  }
});

// ============ ACTIVITY LOG ============

router.get("/activity", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch activity" } });
  }
});

// ============ SETTINGS ============

router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db.select().from(settings);
    const settingsMap = result.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string | null>);
    res.json({ success: true, data: settingsMap });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch settings" } });
  }
});

router.put("/settings", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length) {
        await db.update(settings).set({ value, updatedBy: req.user?.email, updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value, updatedBy: req.user?.email });
      }
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_SETTINGS",
      entityType: "settings",
      description: `Updated ${Object.keys(updates).length} settings`,
    });
    res.json({ success: true, data: { message: "Settings updated" } });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update settings" } });
  }
});

router.get("/images", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db.select().from(images).orderBy(asc(images.displayOrder));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("List images error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to list images" } });
  }
});

router.post("/images", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const { section, imageUrl, alt, caption, displayOrder } = req.body;
    if (!imageUrl) {
      res.status(400).json({ success: false, error: { code: "NO_URL", message: "Image URL is required" } });
      return;
    }
    const db = getDb();
    const [inserted] = await db.insert(images).values({
      section: section || "general",
      imageUrl,
      alt: alt || "",
      caption: caption || "",
      displayOrder: Number(displayOrder) || 0,
    }).returning();

    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "ADD_IMAGE",
      entityType: "image",
      entityId: inserted.id,
      description: `Added image to ${section || "general"}: ${imageUrl.substring(0, 60)}`,
    });
    res.json({ success: true, data: inserted });
  } catch (err) {
    console.error("Add image error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to add image" } });
  }
});

router.put("/images/:id", requireRole("ADMIN", "EDITOR"), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { section, imageUrl, alt, caption, displayOrder, isActive } = req.body;
    const [updated] = await db.update(images).set({
      ...(section !== undefined && { section }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(alt !== undefined && { alt }),
      ...(caption !== undefined && { caption }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    }).where(eq(images.id, req.params.id)).returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Image not found" } });
      return;
    }
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "UPDATE_IMAGE",
      entityType: "image",
      entityId: req.params.id,
      description: `Updated image in ${updated.section}`,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update image error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update image" } });
  }
});

router.delete("/images/:id", requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const [existing] = await db.select().from(images).where(eq(images.id, req.params.id));
    if (!existing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Image not found" } });
      return;
    }
    await db.delete(images).where(eq(images.id, req.params.id));
    await db.insert(activityLogs).values({
      userId: req.user?.userId,
      action: "DELETE_IMAGE",
      entityType: "image",
      entityId: req.params.id,
      description: `Deleted image from ${existing.section}`,
    });
    res.json({ success: true, data: { message: "Image deleted" } });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete image" } });
  }
});

export default router;
