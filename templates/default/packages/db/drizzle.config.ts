import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const monorepoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const pathPart = url.slice("file:".length);
  if (pathPart.startsWith("/") || /^[A-Za-z]:/.test(pathPart)) return url;
  const relative = pathPart.replace(/^\.\//, "");
  return `file:${resolve(monorepoRoot, relative)}`;
}

const dialect = (process.env.DB_DIALECT ?? "sqlite") as "sqlite" | "postgresql";
const url = resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:packages/db/local.db");

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: { url },
});
