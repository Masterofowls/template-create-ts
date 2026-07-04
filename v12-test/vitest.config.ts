import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@pkg/shared": resolve(__dirname, "packages/shared/src"),
      "@pkg/shared/schemas": resolve(__dirname, "packages/shared/src/schemas.ts"),
      "@pkg/shared/security": resolve(__dirname, "packages/shared/src/security.ts"),
      "@pkg/db": resolve(__dirname, "packages/db/src/index.ts"),
      "@pkg/db/health": resolve(__dirname, "packages/db/src/health.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
  },
});
