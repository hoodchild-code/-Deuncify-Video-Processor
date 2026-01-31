import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy /api requests to Python backend
  // We run Python on port 5001 to avoid conflict with Node (5000)
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://0.0.0.0:5001",
      changeOrigin: true,
      logLevel: "debug",
      // For multipart uploads (videos), express.json() / urlencoded() shouldn't interfere
      // as they don't handle multipart. The stream should be piped correctly.
      onProxyReq: (proxyReq, req, res) => {
        // If we needed to restream JSON body, we would do it here.
        // For multipart, it should just work if body parser didn't touch it.
      }
    })
  );

  return httpServer;
}
