# Security Improvements

## Implemented

### Authentication
- **JWT verification** – ES256 (JWKS) and HS256 (secret) with explicit algorithm check; **alg:none rejected**
- **Supabase Auth** – Passwords never touch our server
- **Bearer tokens** – No session cookies; stateless JWT auth

### File Upload
- **MIME type validation** – Only `video/mp4` and `video/quicktime` allowed (Node + Python); `/api/save-video` same check
- **Content validation (Python)** – `python-magic` checks actual file bytes, not just upload headers
- **File size limit** – 500MB enforced in Multer and Python
- **Filename sanitization** – Path traversal removed; control chars stripped; header injection prevented
- **Content-Disposition** – Quotes escaped in filename to avoid header injection
- **Sensitivity clamp (Python)** – Upload `sensitivity` limited to 0.5–20 to avoid abuse

### Data Storage
- **Path traversal guard** – `getVideoFilepath()` rejects `..` and non-basename paths
- **Extension whitelist** – Only `.mp4` and `.mov` stored
- **Drizzle ORM** – Parameterized queries (no raw SQL)
- **30-day retention** – Videos auto-deleted

### Protection
- **Rate limiting** – 200 req/15min general, 20 uploads/hour
- **Helmet** – Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Trust proxy** – Correct IP behind nginx for rate limiting
- **.env in .gitignore** – Secrets not committed

### Infrastructure
- **Python backend** – Internal only (127.0.0.1:5001)
- **HTTPS** – Via nginx + certbot (see deploy docs)

---

## Recommendations (Manual)

1. **CORS** – Node server has no CORS middleware; nginx proxies same-origin. If you add a separate API domain, add `cors` package and restrict `origin`.
2. **Audit dependencies** – Run `npm audit` and `npm audit fix`; review remaining vulnerabilities.
3. **Supabase RLS** – If using Supabase for data beyond Auth, enable Row Level Security.
4. **CSP** – Helmet CSP is disabled for Vite HMR; consider enabling for production with a strict policy (e.g. in a production-only middleware).
5. **Input validation** – Video IDs are validated by Drizzle; add Zod validation for API params if you expand.
6. **Python CORS** – FastAPI uses `allow_origins=["*"]`; if the Python API is ever exposed directly, restrict to your frontend origin.
