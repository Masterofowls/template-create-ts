import cors from "@fastify/cors";
import { healthResponseSchema } from "@pkg/shared/schemas";
import { sanitizeText } from "@pkg/shared/security";
import Fastify from "fastify";
import { Server as SocketServer } from "socket.io";
import { env } from "./env.ts";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

fastify.get("/health", async () => {
  return healthResponseSchema.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    framework: "fastify",
  });
});

fastify.get("/api/echo", async (request) => {
  const { message = "hello" } = request.query as { message?: string };
  return { message: sanitizeText(message) };
});

const io = new SocketServer(fastify.server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
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
  console.log(`🚀 Fastify API running at http://${env.API_HOST}:${env.API_PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export { fastify, io };
