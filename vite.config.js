// vite.config.js

import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // ไม่ต้องกำหนด root และ build.rollupOptions.input แล้ว
  // Vite จะหา index.html ที่ root project เองโดยอัตโนมัติ

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
