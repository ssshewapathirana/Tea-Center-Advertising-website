import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Zod Validation Schemas", () => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
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
  });

  const priceUpdateSchema = z.object({
    teaGradeId: z.string().uuid(),
    newPrice: z.number().positive(),
    effectiveFrom: z.string().optional(),
    reason: z.string().optional(),
  });

  const bulkPriceSchema = z.object({
    teaGradeIds: z.array(z.string().uuid()).min(1),
    operation: z.enum(["increase_percent", "decrease_percent", "increase_fixed", "decrease_fixed"]),
    value: z.number().positive(),
    reason: z.string().optional(),
  });

  const categorySchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    displayOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
  });

  describe("Login validation", () => {
    it("accepts valid login", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "pass" }).success).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(loginSchema.safeParse({ email: "not-email", password: "pass" }).success).toBe(false);
    });

    it("rejects empty password", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    });
  });

  describe("Tea validation", () => {
    const validTea = {
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      gradeCode: "BOP",
      name: "Broken Orange Pekoe",
      slug: "bop",
      processingMethod: "Orthodox",
      groupName: "Orthodox",
    };

    it("accepts valid tea data", () => {
      expect(teaSchema.safeParse(validTea).success).toBe(true);
    });

    it("rejects empty gradeCode", () => {
      expect(teaSchema.safeParse({ ...validTea, gradeCode: "" }).success).toBe(false);
    });

    it("rejects invalid categoryId uuid", () => {
      expect(teaSchema.safeParse({ ...validTea, categoryId: "not-uuid" }).success).toBe(false);
    });

    it("accepts optional fields", () => {
      expect(teaSchema.safeParse({ ...validTea, description: "Bold tea", tasteProfile: "Strong" }).success).toBe(true);
    });

    it("defaults availability to AVAILABLE", () => {
      const result = teaSchema.parse(validTea);
      expect(result.availability).toBe("AVAILABLE");
    });

    it("defaults isPublished to true", () => {
      const result = teaSchema.parse(validTea);
      expect(result.isPublished).toBe(true);
    });

    it("rejects invalid availability", () => {
      expect(teaSchema.safeParse({ ...validTea, availability: "INVALID" }).success).toBe(false);
    });
  });

  describe("Price update validation", () => {
    it("accepts valid price update", () => {
      expect(priceUpdateSchema.safeParse({
        teaGradeId: "550e8400-e29b-41d4-a716-446655440000",
        newPrice: 1295,
      }).success).toBe(true);
    });

    it("rejects negative price", () => {
      expect(priceUpdateSchema.safeParse({
        teaGradeId: "550e8400-e29b-41d4-a716-446655440000",
        newPrice: -100,
      }).success).toBe(false);
    });

    it("rejects zero price", () => {
      expect(priceUpdateSchema.safeParse({
        teaGradeId: "550e8400-e29b-41d4-a716-446655440000",
        newPrice: 0,
      }).success).toBe(false);
    });
  });

  describe("Bulk price validation", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";

    it("accepts valid bulk update", () => {
      expect(bulkPriceSchema.safeParse({
        teaGradeIds: [uuid],
        operation: "increase_percent",
        value: 3,
      }).success).toBe(true);
    });

    it("rejects empty teaGradeIds", () => {
      expect(bulkPriceSchema.safeParse({
        teaGradeIds: [],
        operation: "increase_percent",
        value: 3,
      }).success).toBe(false);
    });

    it("rejects invalid operation", () => {
      expect(bulkPriceSchema.safeParse({
        teaGradeIds: [uuid],
        operation: "multiply",
        value: 3,
      }).success).toBe(false);
    });

    it("rejects negative value", () => {
      expect(bulkPriceSchema.safeParse({
        teaGradeIds: [uuid],
        operation: "increase_percent",
        value: -5,
      }).success).toBe(false);
    });
  });

  describe("Category validation", () => {
    it("accepts valid category", () => {
      expect(categorySchema.safeParse({ name: "Black Tea", slug: "black-tea" }).success).toBe(true);
    });

    it("rejects empty name", () => {
      expect(categorySchema.safeParse({ name: "", slug: "black-tea" }).success).toBe(false);
    });

    it("rejects empty slug", () => {
      expect(categorySchema.safeParse({ name: "Black Tea", slug: "" }).success).toBe(false);
    });
  });
});
