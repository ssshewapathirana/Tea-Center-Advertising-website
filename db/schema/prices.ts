import { pgTable, uuid, varchar, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { teaGrades } from "./tea-grades";

export const prices = pgTable("prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  teaGradeId: uuid("tea_grade_id").references(() => teaGrades.id, { onDelete: "cascade" }).notNull(),
  pricePerKg: numeric("price_per_kg", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("LKR"),
  priceBasis: varchar("price_basis", { length: 50 }).notNull().default("EX_FACTORY_PER_KG"),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  effectiveTo: timestamp("effective_to"),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 255 }),
});
