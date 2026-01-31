import type { Express, Request, Response } from "express";
import { optionalSupabaseAuth } from "./supabase-auth";

export function registerAuthRoutes(app: Express) {
  // Return current user from JWT (if valid). No session - auth is JWT-based via Supabase.
  app.get("/api/me", optionalSupabaseAuth, (req: Request, res: Response) => {
    if (!req.supabaseUser) {
      return res.status(401).json({ detail: "Not authenticated" });
    }
    res.json({
      id: req.supabaseUser.id,
      email: req.supabaseUser.email ?? "",
      createdAt: new Date(), // Supabase doesn't return createdAt in JWT; frontend can use session.created_at
    });
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
