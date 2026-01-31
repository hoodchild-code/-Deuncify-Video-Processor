import { db } from "./db";
import { videos } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const VIDEOS_DIR = path.join(process.cwd(), "data", "videos");
const RETENTION_DAYS = 30;

function ensureVideosDir() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
}

export async function createVideo(
  userId: string,
  originalName: string,
  buffer: Buffer
): Promise<{ id: string; filepath: string }> {
  ensureVideosDir();
  const id = randomUUID();
  const ext = path.extname(originalName) || ".mp4";
  const filename = `${id}${ext}`;
  const filepath = path.join(VIDEOS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  await db.insert(videos).values({
    id,
    userId,
    filename,
    originalName,
  });

  return { id, filepath };
}

export async function getVideoById(id: string) {
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);
  return video;
}

export async function getVideoForUser(userId: string, videoId: string) {
  const [video] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .limit(1);
  return video;
}

export async function listUserVideos(userId: string) {
  return db
    .select({
      id: videos.id,
      originalName: videos.originalName,
      createdAt: videos.createdAt,
    })
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt));
}

export function getVideoFilepath(filename: string): string {
  return path.join(VIDEOS_DIR, filename);
}

export async function deleteExpiredVideos(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffMs = cutoff.getTime();

  const all = await db.select().from(videos);
  const expired = all.filter((r) => (r.createdAt as Date).getTime() < cutoffMs);

  for (const v of expired) {
    const fp = getVideoFilepath(v.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await db.delete(videos).where(eq(videos.id, v.id));
  }
  return expired.length;
}
