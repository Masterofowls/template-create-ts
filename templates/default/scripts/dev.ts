import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const WEB_PORT = Number(process.env.WEB_PORT ?? 9000);
const API_PORT = Number(process.env.API_PORT ?? 9001);
const WEB_URL = process.env.DEV_WEB_URL ?? `http://localhost:${WEB_PORT}`;
const API_URL = process.env.DEV_API_URL ?? `http://localhost:${API_PORT}`;

function isPortFreeOnHost(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, host);
  });
}

async function isPortFree(port: number): Promise<boolean> {
  const v4 = await isPortFreeOnHost(port, "127.0.0.1");
  const v6 = await isPortFreeOnHost(port, "::1");
  return v4 && v6;
}

async function waitForHealth(url: string, attempts = 40): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 503) return true;
    } catch {
      // API still starting
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function spawnLogged(label: string, command: string, args: string[], cwd: string): ChildProcess {
  console.log(`→ ${label}`);
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

function isDatabaseRequired(root: string): boolean {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return true;
  const content = readFileSync(envPath, "utf-8");
  if (/^\s*DB_ENABLED\s*=\s*false\s*$/im.test(content)) return false;
  if (/^\s*DATABASE_URL\s*=\s*(off|false|none)\s*$/im.test(content)) return false;
  return true;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const webFree = await isPortFree(WEB_PORT);
  const apiFree = await isPortFree(API_PORT);

  if (!webFree || !apiFree) {
    console.error("\n❌ Dev ports are already in use:\n");
    if (!webFree) console.error(`   Web port ${WEB_PORT} is busy`);
    if (!apiFree) console.error(`   API port ${API_PORT} is busy`);
    console.error("\nStop other dev servers, then retry.\n");
    console.error("Windows — find the process:");
    console.error(`   netstat -ano | findstr :${WEB_PORT}`);
    console.error(`   netstat -ano | findstr :${API_PORT}`);
    console.error("   taskkill /PID <pid> /F\n");
    process.exit(1);
  }

  console.log(`\n🚀 Starting API at ${API_URL}`);
  if (!isDatabaseRequired(root)) {
    console.log("ℹ️  Database disabled — no db:push needed\n");
  }
  const api = spawnLogged("API", "bun", ["run", "dev"], join(root, "apps", "api"));

  const healthy = await waitForHealth(`${API_URL}/health`);
  if (!healthy) {
    api.kill();
    console.error("\n❌ API did not become healthy.");
    console.error("   1. Ensure .env exists at project root");
    if (isDatabaseRequired(root)) {
      console.error("   2. Run: bun run db:push");
      console.error("   3. Run: bun run dev:api   (to see errors)\n");
    } else {
      console.error("   2. Run: bun run dev:api   (to see errors)\n");
    }
    process.exit(1);
  }

  console.log("✅ API healthy");
  console.log(`🌐 Starting web at ${WEB_URL}\n`);

  const web = spawnLogged("Web", "bun", ["run", "dev"], join(root, "apps", "web"));

  const shutdown = (signal: string) => {
    console.log(`\n${signal} — shutting down dev servers`);
    web.kill();
    api.kill();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  web.on("exit", (code) => {
    api.kill();
    process.exit(code ?? 0);
  });

  api.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`API exited with code ${code}`);
      web.kill();
      process.exit(code);
    }
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
