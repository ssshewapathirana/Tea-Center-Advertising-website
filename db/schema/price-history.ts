import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { teaGrades } from "./tea-grades.js";

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  teaGradeId: uuid("tea_grade_id").references(() => teaGrades.id, { onDelete: "cascade" }).notNull(),
  oldPrice: numeric("old_price", { precision: 12, scale: 2 }),
  newPrice: numeric("new_price", { precision: 12, scale: 2 }).notNull(),
  percentageChange: numeric("percentage_change", { precision: 8, scale: 2 }),
  currency: varchar("currency", { length: 10 }).notNull().default("LKR"),
  priceBasis: varchar("price_basis", { length: 50 }).notNull().default("EX_FACTORY_PER_KG"),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  changedBy: varchar("changed_by", { length: 255 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
