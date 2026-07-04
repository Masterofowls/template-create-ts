import { defineConfig } from "drizzle-kit";

const dialect = (process.env.DB_DIALECT ?? "sqlite") as "sqlite" | "postgresql";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./local.db",
  },
});
