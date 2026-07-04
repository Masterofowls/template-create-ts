import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageSrcDir = dirname(fileURLToPath(import.meta.url));

/** Monorepo root (parent of packages/). */
export const monorepoRoot = resolve(packageSrcDir, "../../..");

/** Resolve sqlite file: URLs relative to the monorepo root. */
export function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) return url;

  const pathPart = url.slice("file:".length);
  if (pathPart.startsWith("/") || /^[A-Za-z]:/.test(pathPart)) {
    return url;
  }

  const relative = pathPart.replace(/^\.\//, "");
  return `file:${resolve(monorepoRoot, relative)}`;
}
