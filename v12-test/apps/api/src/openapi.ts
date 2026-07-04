import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { healthResponseSchema } from "@pkg/shared/schemas";

const healthOpenApiSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  timestamp: z.string(),
  version: z.string(),
  framework: z.string(),
  database: z.object({
    status: z.enum(["ok", "degraded"]),
    dialect: z.string(),
  }),
});

export function createOpenApiApp() {
  const app = new OpenAPIHono();

  const healthRoute = createRoute({
    method: "get",
    path: "/health",
    responses: {
      200: {
        content: { "application/json": { schema: healthOpenApiSchema } },
        description: "Service health including database connectivity",
      },
    },
  });

  app.openapi(healthRoute, async (c) => {
    const { checkDatabaseHealth } = await import("@pkg/db/health");
    const database = await checkDatabaseHealth();
    const response = healthResponseSchema.parse({
      status: database.status === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      framework: "hono",
      database,
    });
    return c.json(response, response.status === "ok" ? 200 : 503);
  });

  const echoRoute = createRoute({
    method: "get",
    path: "/api/echo",
    request: {
      query: z.object({ message: z.string().optional() }),
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: z.object({ message: z.string() }) },
        },
        description: "Echo sanitized message",
      },
    },
  });

  app.openapi(echoRoute, async (c) => {
    const { sanitizeText } = await import("@pkg/shared/security");
    const { message = "hello" } = c.req.valid("query");
    return c.json({ message: sanitizeText(message) });
  });

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "v12-test API", version: "1.0.0" },
  });

  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  return app;
}
