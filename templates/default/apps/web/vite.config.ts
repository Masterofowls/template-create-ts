import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const envDir = resolve(__dirname, "../..");
  const env = loadEnv(mode, envDir, "");
  const port = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 9000);
  const apiUrl = env.VITE_API_URL ?? "http://localhost:9001";

  return {
    plugins: [react()],
    envDir,
    server: {
      // Listen on all interfaces so both http://localhost and http://127.0.0.1 work (Windows IPv6)
      host: true,
      port,
      strictPort: true,
      proxy: {
        "/api": { target: apiUrl, changeOrigin: true },
        "/health": { target: apiUrl, changeOrigin: true },
        "/docs": { target: apiUrl, changeOrigin: true },
        "/openapi.json": { target: apiUrl, changeOrigin: true },
      },
    },
    preview: {
      host: true,
      port,
      strictPort: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
