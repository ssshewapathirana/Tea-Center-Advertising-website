import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, getAuthSecret(), { expiresIn: "24h" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;
  if (!token) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    return;
  }
  try {
    const decoded = jwt.verify(token, getAuthSecret()) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
