import type { Express, Request, Response } from "express";
import multer from "multer";
import { createReadStream } from "fs";
import { Readable } from "stream";
import {
  createVideo,
  getVideoForUser,
  listUserVideos,
  getVideoFilepath,
} from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const PYTHON_URL = "http://127.0.0.1:5001";
const PYTHON_TIMEOUT = 15 * 60 * 1000; // 15 minutes

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ detail: "Login required" });
    return;
  }
  next();
}

export function registerVideoRoutes(app: Express) {
  // Handle uploads: receive file, forward to Python, save result, return to client
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded" });
    }

    const originalName = req.file.originalname || "video.mp4";
    console.log(`[upload] Received ${originalName} (${req.file.size} bytes), forwarding to Python...`);

    try {
      // Build FormData to send to Python
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "video/mp4" });
      formData.append("file", blob, originalName);

      // Forward to Python with long timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PYTHON_TIMEOUT);

      const pythonRes = await fetch(`${PYTHON_URL}/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!pythonRes.ok) {
        const errText = await pythonRes.text().catch(() => "Unknown error");
        console.error(`[upload] Python returned ${pythonRes.status}: ${errText}`);
        return res.status(pythonRes.status).json({ detail: errText || "Processing failed" });
      }

      const resultBuffer = Buffer.from(await pythonRes.arrayBuffer());
      console.log(`[upload] Python returned ${resultBuffer.length} bytes`);

      // Save to history if user is logged in
      if (req.isAuthenticated() && req.user) {
        const userId = (req.user as { id: string }).id;
        const saveName = originalName.replace(/\.[^.]+$/, "") + "_deuncified.mp4";
        try {
          await createVideo(userId, saveName, resultBuffer);
          console.log(`[upload] Saved to history for user ${userId}`);
        } catch (saveErr) {
          console.error("[upload] Failed to save to history:", saveErr);
          // Don't fail the request - video still works
        }
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="deuncified_${originalName}"`);
      res.send(resultBuffer);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("[upload] Python request timed out");
        return res.status(504).json({ detail: "Processing timed out. Try a shorter video." });
      }
      console.error("[upload] Error:", err);
      return res.status(500).json({ detail: "Video processing failed" });
    }
  });

  app.post("/api/save-video", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    if (!req.file || !req.user) {
      return res.status(400).json({ detail: "No file" });
    }
    const userId = (req.user as { id: string }).id;
    const originalName = req.body.originalName || req.file.originalname || "deuncified_video.mp4";
    try {
      await createVideo(userId, originalName, req.file.buffer);
      res.json({ ok: true });
    } catch (err) {
      console.error("Save video error:", err);
      res.status(500).json({ detail: "Failed to save" });
    }
  });

  app.get("/api/videos", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.user as { id: string }).id;
    try {
      const list = await listUserVideos(userId);
      res.json(
        list.map((v) => ({
          id: v.id,
          originalName: v.originalName,
          createdAt: v.createdAt,
        }))
      );
    } catch (err) {
      console.error("List videos error:", err);
      res.status(500).json({ detail: "Failed to list videos" });
    }
  });

  app.get("/api/videos/:id", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.user as { id: string }).id;
    const videoId = String(req.params.id);
    try {
      const video = await getVideoForUser(userId, videoId);
      if (!video) {
        return res.status(404).json({ detail: "Video not found" });
      }
      const filepath = getVideoFilepath(video.filename);
      const stream = createReadStream(filepath);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="${video.originalName}"`);
      stream.pipe(res);
    } catch (err) {
      console.error("Get video error:", err);
      res.status(500).json({ detail: "Failed to load video" });
    }
  });
}
