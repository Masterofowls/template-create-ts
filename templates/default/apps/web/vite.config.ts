import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const root = __dirname;
  const envDir = resolve(root, "../..");
  const env = loadEnv(mode, envDir, "");
  const port = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 9000);
  const apiUrl = env.VITE_API_URL ?? "http://localhost:9001";

  return {
    root,
    publicDir: resolve(root, "public"),
    plugins: [react()],
    envDir,
    resolve: {
      alias: {
        "@": resolve(root, "src"),
      },
    },
    server: {
      host: true,
      port,
      strictPort: true,
      open: false,
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
      emptyOutDir: true,
      sourcemap: true,
    },
  };
});
