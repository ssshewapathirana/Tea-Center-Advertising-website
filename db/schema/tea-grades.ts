import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories.js";

export const teaGrades = pgTable("tea_grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }).notNull(),
  gradeCode: varchar("grade_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  processingMethod: varchar("processing_method", { length: 100 }).notNull(),
  groupName: varchar("group_name", { length: 100 }).notNull(),
  description: text("description"),
  tasteProfile: varchar("taste_profile", { length: 500 }),
  cupColour: varchar("cup_colour", { length: 100 }),
  bestFor: varchar("best_for", { length: 500 }),
  availability: varchar("availability", { length: 20 }).notNull().default("AVAILABLE"),
  isPublished: boolean("is_published").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
