import { z } from "zod";

// Simple response schema for health check
export const healthResponseSchema = z.object({
  status: z.string(),
});

// Since the upload endpoint returns a file directly, we don't have a JSON schema for the response body in the traditional sense.
// But we can define types for errors or metadata if we were returning JSON.
// For this app, we return a Blob (File).

export const errorSchema = z.object({
  detail: z.string(),
});
