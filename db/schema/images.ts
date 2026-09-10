import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  section: varchar("section", { length: 100 }).notNull().default("general"),
  imageUrl: text("image_url").default(""),
  alt: varchar("alt", { length: 255 }).default(""),
  caption: text("caption").default(""),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
