import { z } from "zod";
import { healthResponseSchema, errorSchema } from "./schema";

export { healthResponseSchema, errorSchema };

export const api = {
  upload: {
    method: "POST",
    path: "/api/upload",
    responses: { 200: z.any(), 400: errorSchema, 401: errorSchema, 500: errorSchema },
  },
  health: {
    method: "GET",
    path: "/api/health",
    responses: { 200: healthResponseSchema },
  },
  register: { method: "POST", path: "/api/register" },
  login: { method: "POST", path: "/api/login" },
  logout: { method: "POST", path: "/api/logout" },
  me: { method: "GET", path: "/api/me" },
  videos: {
    list: { method: "GET", path: "/api/videos" },
    get: (id: string) => ({ method: "GET" as const, path: `/api/videos/${id}` }),
    save: { method: "POST", path: "/api/save-video" },
  },
};

// Helper function for URL construction
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
