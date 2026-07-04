import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  version: z.string(),
  framework: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
