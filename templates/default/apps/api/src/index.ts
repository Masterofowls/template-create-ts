import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { checkDatabaseHealth } from "@pkg/db/health";
import { allowedCorsOrigins, resolveCorsOrigin } from "@pkg/shared/cors";
import { healthHttpStatus, healthResponseSchema, resolveServiceStatus } from "@pkg/shared/schemas";
import { sanitizeText } from "@pkg/shared/security";
import Fastify from "fastify";
import { Server as SocketServer } from "socket.io";
import { env } from "./env.ts";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = resolveCorsOrigin(origin, env.CORS_ORIGIN);
    if (allowed) cb(null, allowed);
    else cb(new Error("CORS not allowed"), false);
  },
  credentials: true,
});

await fastify.register(swagger, {
  openapi: {
    openapi: "3.0.0",
    info: { title: "{{PROJECT_NAME}} API", version: "1.0.0" },
  },
});

await fastify.register(swaggerUi, {
  routePrefix: "/docs",
});

fastify.get("/health", async (_request, reply) => {
  const database = await checkDatabaseHealth();
  const status = resolveServiceStatus(database);
  const response = healthResponseSchema.parse({
    status,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    framework: "fastify",
    database,
  });
  return reply.status(healthHttpStatus(status)).send(response);
});

fastify.get("/api/echo", async (request) => {
  const { message = "hello" } = request.query as { message?: string };
  return { message: sanitizeText(message) };
});

const io = new SocketServer(fastify.server, {
  cors: { origin: allowedCorsOrigins(env.CORS_ORIGIN), credentials: true },
});

io.on("connection", (socket) => {
  fastify.log.info(`[socket] client connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  socket.on("message", (data: { text?: string }) => {
    const text = sanitizeText(data?.text ?? "");
    io.emit("message", { text, from: socket.id });
  });
});

try {
  await fastify.listen({ port: env.API_PORT, host: env.API_HOST });
  console.log(`🚀 Fastify API running at http://localhost:${env.API_PORT}`);
  console.log(`📚 OpenAPI docs at http://localhost:${env.API_PORT}/docs`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export { fastify, io };
