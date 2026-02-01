/**
 * Standalone server build - use if full build fails partway (e.g. OOM during client build).
 * Requires dist/public/ to already exist from client build.
 */
import { build as esbuild } from "esbuild";
import { readFile } from "fs/promises";

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "helmet",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildServer() {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [...allDeps.filter((dep) => !allowlist.includes(dep)), "dotenv", "dotenv/config"];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: [...externals, "./vite", "./vite.js", "vite"],
    logLevel: "info",
  });
  console.log("Server build done: dist/index.cjs");
}

buildServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
