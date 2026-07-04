import { createAdaptorServer } from "@hono/node-server";
import { healthResponseSchema } from "@pkg/shared/schemas";
import { sanitizeText } from "@pkg/shared/security";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Server as SocketServer } from "socket.io";
import { createAuth } from "./auth.ts";
import { env } from "./env.ts";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use("*", secureHeaders());

const auth = createAuth();

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => {
  const response = healthResponseSchema.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    framework: "hono",
  });
  return c.json(response);
});

app.get("/api/echo", (c) => {
  const message = c.req.query("message") ?? "hello";
  return c.json({ message: sanitizeText(message) });
});

const server = createAdaptorServer(app);

const io = new SocketServer(server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  socket.on("message", (data: { text?: string }) => {
    const text = sanitizeText(data?.text ?? "");
    io.emit("message", { text, from: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

server.listen(env.API_PORT, env.API_HOST, () => {
  console.log(`🚀 Hono API running at http://${env.API_HOST}:${env.API_PORT}`);
  console.log("🔌 Socket.IO attached on same port");
});

export { app, io, server };
