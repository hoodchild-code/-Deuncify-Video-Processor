# Codebase Review: Security, Improvements, Efficiency

Summary of the full codebase review and changes applied.

---

## What Was Implemented (This Pass)

### Security
- **Python `/upload`**: `sensitivity` parameter clamped to 0.5–20 to avoid abuse and numerical issues.
- **Node `/api/save-video`**: MIME type validation (MP4/MOV only) and Multer error handling (file size, invalid file).
- **Node error handler**: In production, 500 responses return generic "Internal Server Error" instead of leaking `err.message`.
- **Auth logging**: Optional-auth "Authenticated user" and "No token/secret" logs only in development.

### Efficiency
- **`deleteExpiredVideos`**: Batched delete (100 at a time) with `WHERE createdAt < cutoff` instead of loading all rows into memory.

### Housekeeping
- **`.gitignore`**: Fixed typo (`.env.*.local__pycache__/` → separate lines), added `*.egg-info/`.
- **`docs/SECURITY.md`**: Updated with content validation, sensitivity clamp, save-video MIME, and Python CORS note.

---

## Security Summary (Already in Place)

- **Auth**: JWT ES256 (JWKS) + HS256; `alg:none` rejected; Supabase Auth.
- **Upload**: MIME + python-magic content check (Python); sanitized filenames; path traversal guards; 500MB limit; 10 min max duration.
- **Storage**: Drizzle parameterized queries; `getVideoFilepath` rejects `..`; 30-day retention.
- **Infra**: Rate limits (200/15min, 20 uploads/hour); Helmet; trust proxy; Python on 127.0.0.1 only.

---

## Remaining Recommendations

### Security (Manual / When Needed)
1. **CSP** – Enable Helmet CSP in production with a strict policy (e.g. only when `NODE_ENV=production` and not using Vite HMR).
2. **Python CORS** – If the FastAPI app is ever exposed directly, set `allow_origins` to your frontend origin(s) instead of `*`.
3. **Dependency audits** – Run `npm audit` / `npm audit fix` and address critical/high.
4. **Supabase RLS** – If you add Supabase tables beyond Auth, enable RLS.

### Efficiency (Future)
1. **Upload memory** – Node uses Multer `memoryStorage()`, so the full file is in Node memory then forwarded to Python. For very large files or high concurrency, consider streaming to a temp file and piping to Python, or streaming directly to Python (more involved).
2. **Python** – Concurrency and ProcessPoolExecutor are already capped; consider tuning `MAX_CONCURRENT_JOBS` per host.

### Code Quality
1. **Zod on API params** – For new or expanded routes, validate `req.params` / `req.query` with Zod (or shared schema) before use.
2. **Tests** – Add pytest for Python (`/upload`, `/validate`, edge cases) and Jest/Vitest for Node routes and storage.

---

## File-Level Notes

| Area | File(s) | Notes |
|------|--------|--------|
| Auth | `server/supabase-auth.ts` | JWKS + HS256; optional auth logs only in dev. |
| Video API (Node) | `server/video-routes.ts` | Upload + save-video MIME and Multer errors; sanitizeFilename. |
| Video API (Python) | `main.py` | Magic validation, Config, temp cleanup, sensitivity clamp, MAX_DURATION. |
| Storage | `server/storage.ts` | Batched expiry delete; path guard in getVideoFilepath. |
| App entry | `server/index.ts` | Rate limiters, Helmet, generic 500 message in prod. |
| Proxy | `server/routes.ts` | /api → Python; specific routes (me, upload, videos) handled by Node first. |

---

*Review and fixes applied 2025-02-02.*
