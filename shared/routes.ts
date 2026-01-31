import { z } from "zod";
import { healthResponseSchema, errorSchema } from "./schema";

export { healthResponseSchema, errorSchema };

export const api = {
  upload: {
    method: "POST",
    path: "/api/upload",
    // Input is multipart/form-data, difficult to express fully in Zod for the frontend generator to automatically build a form,
    // so we rely on implementation notes.
    responses: {
      200: z.any(), // Returns a video file blob
      400: errorSchema,
      500: errorSchema,
    },
  },
  health: {
    method: "GET",
    path: "/api/health",
    responses: {
      200: healthResponseSchema,
    },
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
