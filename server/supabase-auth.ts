import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export interface SupabaseUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseUser;
    }
  }
}

// Lazy initialization of JWKS client (after dotenv loads)
let client: ReturnType<typeof jwksClient> | null = null;

function getJwksClient(): ReturnType<typeof jwksClient> | null {
  if (client) return client;
  
  // Get Supabase URL from env (for JWKS endpoint)
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  
  if (!SUPABASE_URL) {
    console.warn("[auth] SUPABASE_URL not set - JWKS verification will not work");
    return null;
  }

  // Supabase JWKS endpoint is at /auth/v1/.well-known/jwks.json
  const jwksUri = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[auth] Initializing JWKS client with URI: ${jwksUri}`);
  }
  
  client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 86400000, // 24 hours
    timeout: 30000, // 30s timeout
  });
  
  return client;
}

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  const jwksClientInstance = getJwksClient();
  if (!jwksClientInstance) {
    callback(new Error("JWKS client not configured - set SUPABASE_URL in .env"));
    return;
  }
  if (!header.kid) {
    callback(new Error("Token missing kid (key ID)"));
    return;
  }
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error(`[auth] JWKS getSigningKey error for kid ${header.kid}:`, err.message);
      callback(err);
      return;
    }
    try {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    } catch (keyErr) {
      console.error("[auth] Error getting public key:", keyErr);
      callback(keyErr as Error);
    }
  });
}

export function requireSupabaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error("SUPABASE_JWT_SECRET not set");
    res.status(500).json({ detail: "Server misconfiguration" });
    return;
  }

  // Decode header to check algorithm
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader) {
    return res.status(401).json({ detail: "Invalid token format" });
  }
  if (decodedHeader.header.alg === "none" || decodedHeader.header.alg === "alg") {
    return res.status(401).json({ detail: "Invalid token algorithm" });
  }

  // Supabase user tokens use ES256 (JWKS), anon/service_role use HS256 (secret)
  if (decodedHeader.header.alg === "ES256") {
    const jwksClientInstance = getJwksClient();
    if (!jwksClientInstance) {
      return res.status(500).json({ detail: "JWKS client not configured - set SUPABASE_URL in .env" });
    }
    
    // Verify with JWKS (public key) - must use callback form for async key fetching
    jwt.verify(token, getKey, { algorithms: ["ES256"] }, (err, decodedToken) => {
      if (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          console.error("[auth] JWT error:", err.name, err.message);
        } else if (err instanceof jwt.TokenExpiredError) {
          console.error("[auth] Token expired at:", err.expiredAt);
        } else {
          console.error("[auth] JWT verification failed:", err);
        }
        return res.status(401).json({ detail: "Invalid or expired token" });
      }
      const decoded = decodedToken as { sub: string; email?: string };
      req.supabaseUser = {
        id: decoded.sub,
        email: decoded.email,
      };
      next();
    });
  } else if (decodedHeader.header.alg === "HS256" && secret) {
    // Verify with secret (for anon/service_role tokens)
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { sub: string; email?: string };
      req.supabaseUser = {
        id: decoded.sub,
        email: decoded.email,
      };
      next();
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        console.error("[auth] JWT error:", err.name, err.message);
      } else if (err instanceof jwt.TokenExpiredError) {
        console.error("[auth] Token expired at:", err.expiredAt);
      } else {
        console.error("[auth] JWT verification failed:", err);
      }
      res.status(401).json({ detail: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ detail: `Unsupported algorithm: ${decodedHeader.header.alg}` });
  }
}

export function optionalSupabaseAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    console.log("[auth] No token provided");
    next();
    return;
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.log("[auth] No JWT secret configured");
    next();
    return;
  }

  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader) {
      next();
      return;
    }

    if (decodedHeader.header.alg === "none" || decodedHeader.header.alg === "alg") {
      next();
      return;
    }
    // Supabase user tokens use ES256 (JWKS), anon/service_role use HS256 (secret)
    if (decodedHeader.header.alg === "ES256") {
      const jwksClientInstance = getJwksClient();
      if (!jwksClientInstance) {
        next();
        return;
      }
      // Verify with JWKS (public key) - must use callback form for async key fetching
      jwt.verify(token, getKey, { algorithms: ["ES256"] }, (err, decodedToken) => {
        if (!err && decodedToken) {
          const decoded = decodedToken as { sub: string; email?: string };
          req.supabaseUser = {
            id: decoded.sub,
            email: decoded.email,
          };
          console.log(`[auth] Authenticated user: ${decoded.sub}`);
        }
        // Continue regardless - this is optional auth
        next();
      });
      return; // Return early since we're using callback
    } else if (decodedHeader.header.alg === "HS256" && secret) {
      try {
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { sub: string; email?: string };
        req.supabaseUser = {
          id: decoded.sub,
          email: decoded.email,
        };
        console.log(`[auth] Authenticated user: ${decoded.sub}`);
      } catch {
        // ignore invalid tokens for optional auth
      }
    }
  } catch (err) {
    // ignore invalid tokens for optional auth
  }
  next();
}
