import { config } from "dotenv";
import path from "path";

// Load .env from project root
config({ path: path.resolve(process.cwd(), ".env") });
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { registerVideoRoutes } from "./video-routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { spawn } from "child_process";
import { execSync } from "child_process";
import { deleteExpiredVideos } from "./storage";

// process.cwd() works in both ESM dev and CJS prod (run from project root)
const PROJECT_ROOT = process.cwd();
const PYTHON_PORT = 5001;

function killProcessesOnPort(port: number): void {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
      const pids = new Set<string>();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue; // Only kill listeners, not client connections
        const m = line.trim().match(/\s+(\d+)\s*$/);
        if (m) pids.add(m[1]);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch {
          // ignore
        }
      }
    } else {
      try {
        const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim().split(/\s+/).filter(Boolean);
        for (const pid of pids) {
          try {
            process.kill(Number(pid), "SIGKILL");
          } catch {
            // ignore
          }
        }
      } catch {
        // Port may be free
      }
    }
  } catch {
    // Port may be free
  }
}

const app = express();
app.set("trust proxy", 1); // behind nginx
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Kill orphaned uvicorn processes from previous runs (port conflicts)
  killProcessesOnPort(PYTHON_PORT);
  await new Promise((r) => setTimeout(r, 1500)); // Let port release

  log("Starting Python backend on port 5001...");
  const isDev = process.env.NODE_ENV !== "production";
  const pythonProcess = spawn(
    process.platform === "win32" ? "python" : "python3",
    ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(PYTHON_PORT), ...(isDev ? ["--reload"] : [])],
    {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      env: { ...process.env },
    }
  );

  pythonProcess.on("error", (err) => {
    console.error("Failed to start Python backend:", err);
  });

  const killPython = () => {
    try {
      pythonProcess.kill("SIGTERM");
    } catch {
      // ignore
    }
  };
  process.on("exit", killPython);
  process.on("SIGINT", () => {
    killPython();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    killPython();
    process.exit(0);
  });

  registerAuthRoutes(app);
  registerVideoRoutes(app);
  await registerRoutes(httpServer, app);

  // Clean up expired videos on startup and every 24h
  const runCleanup = async () => {
    const deleted = await deleteExpiredVideos();
    if (deleted > 0) log(`Deleted ${deleted} expired video(s)`);
  };
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5000 if not specified. Use 127.0.0.1 on Windows to avoid ENOTSUP.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "127.0.0.1";
  httpServer.listen(
    { port, host },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
