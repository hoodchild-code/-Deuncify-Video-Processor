import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy /api requests to Python backend
  // We run Python on port 5001 to avoid conflict with Node (5000)
  // pathRewrite strips /api so /api/upload -> /upload (FastAPI expects /upload)
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:5001",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
      proxyTimeout: 20 * 60 * 1000, // 20 min - MoviePy can be slow
      timeout: 20 * 60 * 1000,
    })
  );

  return httpServer;
}
