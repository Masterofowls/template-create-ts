import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketServer } from "socket.io";
import { healthResponseSchema } from "@pkg/shared/schemas";
import { sanitizeText } from "@pkg/shared/security";
import { createAuth } from "./auth.ts";
import { env } from "./env.ts";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

const auth = createAuth();

fastify.all("/api/auth/*", async (request, reply) => {
  const url = new URL(request.url, env.BETTER_AUTH_URL);
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? JSON.stringify(request.body)
      : undefined;

  const response = await auth.handler(
    new Request(url.toString(), {
      method: request.method,
      headers,
      body,
    }),
  );

  reply.status(response.status);
  for (const [key, value] of response.headers.entries()) {
    reply.header(key, value);
  }
  const text = await response.text();
  return reply.send(text ? JSON.parse(text) : null);
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
