import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  envDir: resolve(__dirname, "../.."),
  server: {
    port: 9000,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:9001",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_URL ?? "http://localhost:9001",
        changeOrigin: true,
      },
      "/docs": {
        target: process.env.VITE_API_URL ?? "http://localhost:9001",
        changeOrigin: true,
      },
      "/openapi.json": {
        target: process.env.VITE_API_URL ?? "http://localhost:9001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
