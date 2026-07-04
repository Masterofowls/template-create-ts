import { createAdaptorServer } from "@hono/node-server";
import { allowedCorsOrigins, resolveCorsOrigin } from "@pkg/shared/cors";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Server as SocketServer } from "socket.io";
import { env } from "./env.ts";
import { createOpenApiApp } from "./openapi.ts";

const root = new Hono();

root.use("*", logger());
root.use(
  "*",
  cors({
    origin: (origin) => resolveCorsOrigin(origin, env.CORS_ORIGIN),
    credentials: true,
  }),
);
root.use("*", secureHeaders());

const api = createOpenApiApp();
root.route("/", api);

const server = createAdaptorServer(root);

const io = new SocketServer(server, {
  cors: { origin: allowedCorsOrigins(env.CORS_ORIGIN), credentials: true },
});

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  socket.on("message", async (data: { text?: string }) => {
    const { sanitizeText } = await import("@pkg/shared/security");
    const text = sanitizeText(data?.text ?? "");
    io.emit("message", { text, from: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

server.listen(env.API_PORT, env.API_HOST, () => {
  console.log(`🚀 Hono API running at http://localhost:${env.API_PORT}`);
  console.log(`📚 OpenAPI docs at http://localhost:${env.API_PORT}/docs`);
  console.log("🔌 Socket.IO attached on same port");
});

export { root as app, io, server };
