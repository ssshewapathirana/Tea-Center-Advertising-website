import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { asc } from "drizzle-orm";
import { images } from "../db/schema/images";

const app = express();

const allowedOrigin = process.env.VITE_DEV_SERVER_URL || process.env.FRONTEND_URL;
app.use(cors({ origin: allowedOrigin || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/images", async (_req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
    const db = drizzle(neon(databaseUrl));
    const result = await db.select().from(images).orderBy(asc(images.displayOrder));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Public images error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch images" } });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Newberg Tea Centre API server running on port ${PORT}`));
}

export default app;
