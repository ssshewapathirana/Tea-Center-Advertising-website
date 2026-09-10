import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema/users";
import { generateToken, authMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid email or password" } });
      return;
    }

    const db = drizzle(neon(process.env.DATABASE_URL!));
    const result = await db.select().from(users).where(eq(users.email, parsed.data.email));

    if (!result.length) {
      res.status(401).json({ success: false, error: { code: "AUTH_FAILED", message: "Invalid email or password" } });
      return;
    }

    const user = result[0];
    if (!user.isActive) {
      res.status(403).json({ success: false, error: { code: "ACCOUNT_DISABLED", message: "Account is disabled" } });
      return;
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: { code: "AUTH_FAILED", message: "Invalid email or password" } });
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(tokenPayload);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true, data: { message: "Logged out" } });
});

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    return;
  }
  res.json({ success: true, data: { user: req.user } });
});

export default router;
