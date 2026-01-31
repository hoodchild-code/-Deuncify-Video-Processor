import type { Express, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { registerSchema, loginSchema, userSchema } from "@shared/schema";

export function registerAuthRoutes(app: Express) {
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          detail: parsed.error.errors.map((e) => e.message).join(", "),
        });
      }
      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase();

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (existing) {
        return res.status(400).json({ detail: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          email: normalizedEmail,
          passwordHash,
        })
        .returning();
      if (!user) {
        return res.status(500).json({ detail: "Registration failed" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ detail: "Login after registration failed" });
        }
        res.json(userSchema.parse({
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        }));
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ detail: "Registration failed" });
    }
  });

  app.post("/api/login", (req: Request, res: Response, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        detail: parsed.error.errors.map((e) => e.message).join(", "),
      });
    }
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ detail: "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const u = user as { id: string; email: string; createdAt: Date };
        res.json(userSchema.parse({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
        }));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ detail: "Logout failed" });
      }
      res.json({ ok: true });
    });
  });

  app.get("/api/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ detail: "Not authenticated" });
    }
    const u = req.user as { id: string; email: string; createdAt: Date };
    res.json(userSchema.parse({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
    }));
  });

  // Health check: Node fetches Python directly (avoids proxy issues)
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const r = await fetch("http://127.0.0.1:5001/health", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (r.ok) {
        const data = await r.json();
        return res.json(data);
      }
    } catch {
      // Python unreachable
    }
    return res.status(503).json({ status: "offline" });
  });
}
