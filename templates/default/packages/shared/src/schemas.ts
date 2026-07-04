import { z } from "zod";

export const dbHealthSchema = z.object({
  status: z.enum(["ok", "degraded", "disabled"]),
  dialect: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  timestamp: z.string(),
  version: z.string(),
  framework: z.string(),
  database: dbHealthSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type DbHealth = z.infer<typeof dbHealthSchema>;

/** API is healthy when DB is ok or intentionally disabled. */
export function resolveServiceStatus(database: DbHealth): "ok" | "degraded" {
  if (database.status === "disabled" || database.status === "ok") return "ok";
  return "degraded";
}

export function healthHttpStatus(serviceStatus: "ok" | "degraded"): number {
  return serviceStatus === "ok" ? 200 : 503;
}
