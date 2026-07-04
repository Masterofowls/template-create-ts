import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(9001),
  API_HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_SECRET: z
    .string()
    .min(32, "APP_SECRET must be at least 32 characters")
    .default("dev-secret-change-me-in-production-32chars"),
  CORS_ORIGIN: z.string().url().default("http://localhost:9000"),
  DATABASE_URL: z.string().default("file:./local.db"),
  DB_DIALECT: z
    .enum(["sqlite", "postgresql", "none"])
    .default(process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
