import { z } from "zod";

export const dbHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
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
