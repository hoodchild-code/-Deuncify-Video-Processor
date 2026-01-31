import type { Express, Request, Response } from "express";
import multer from "multer";
import { createReadStream } from "fs";
import axios from "axios";
import {
  createVideo,
  getVideoForUser,
  listUserVideos,
  getVideoFilepath,
} from "./storage";
import { requireSupabaseAuth, optionalSupabaseAuth } from "./supabase-auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const PYTHON_URL = "http://127.0.0.1:5001";
const PYTHON_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export function registerVideoRoutes(app: Express) {
  // Handle uploads: receive file, forward to Python, save result, return to client
  // optionalSupabaseAuth - if logged in (JWT), save to history; if not, still process
  app.post(
    "/api/upload",
    optionalSupabaseAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ detail: "No file uploaded" });
      }

      const originalName = req.file.originalname || "video.mp4";
      console.log(
        `[upload] Received ${originalName} (${req.file.size} bytes), forwarding to Python...`
      );

      try {
        const FormData = (await import("form-data")).default;
        const formData = new FormData();
        formData.append("file", req.file.buffer, {
          filename: originalName,
          contentType: req.file.mimetype || "video/mp4",
        });

        const timeout = PYTHON_TIMEOUT;
        const pythonRes = await axios.post(`${PYTHON_URL}/upload`, formData, {
          headers: formData.getHeaders(),
          responseType: "arraybuffer",
          timeout,
        });

        const resultBuffer = Buffer.from(pythonRes.data);
        console.log(`[upload] Python returned ${resultBuffer.length} bytes`);

        // Save to history if user is logged in (JWT)
        if (req.supabaseUser) {
          const userId = req.supabaseUser.id;
          const saveName =
            originalName.replace(/\.[^.]+$/, "") + "_deuncified.mp4";
          try {
            await createVideo(userId, saveName, resultBuffer);
            console.log(`[upload] Saved to history for user ${userId} (${saveName})`);
          } catch (saveErr) {
            console.error("[upload] Failed to save to history:", saveErr);
            // Log the full error for debugging
            if (saveErr instanceof Error) {
              console.error("[upload] Error details:", saveErr.message, saveErr.stack);
            }
          }
        } else {
          console.log("[upload] No user authenticated - skipping history save");
        }

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="deuncified_${originalName}"`
        );
        res.send(resultBuffer);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
            console.error("[upload] Python request timed out");
            return res
              .status(504)
              .json({ detail: "Processing timed out. Try a shorter video." });
          }
          const status = err.response?.status || 500;
          const errText = err.response?.data
            ? Buffer.isBuffer(err.response.data)
              ? err.response.data.toString()
              : JSON.stringify(err.response.data)
            : err.message;
          console.error(`[upload] Python returned ${status}: ${errText}`);
          return res.status(status).json({
            detail: errText || "Processing failed",
          });
        }
        console.error("[upload] Error:", err);
        return res.status(500).json({ detail: "Video processing failed" });
      }
    }
  );

  app.post(
    "/api/save-video",
    requireSupabaseAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file || !req.supabaseUser) {
        return res.status(400).json({ detail: "No file" });
      }
      const userId = req.supabaseUser.id;
      const originalName =
        req.body.originalName || req.file.originalname || "deuncified_video.mp4";
      try {
        await createVideo(userId, originalName, req.file.buffer);
        res.json({ ok: true });
      } catch (err) {
        console.error("Save video error:", err);
        res.status(500).json({ detail: "Failed to save" });
      }
    }
  );

  app.get("/api/videos", requireSupabaseAuth, async (req: Request, res: Response) => {
    const userId = req.supabaseUser!.id;
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

  app.get(
    "/api/videos/:id",
    requireSupabaseAuth,
    async (req: Request, res: Response) => {
      const userId = req.supabaseUser!.id;
      const videoId = String(req.params.id);
      try {
        const video = await getVideoForUser(userId, videoId);
        if (!video) {
          return res.status(404).json({ detail: "Video not found" });
        }
        const filepath = getVideoFilepath(video.filename);
        const stream = createReadStream(filepath);
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${video.originalName}"`
        );
        stream.pipe(res);
      } catch (err) {
        console.error("Get video error:", err);
        res.status(500).json({ detail: "Failed to load video" });
      }
    }
  );
}
