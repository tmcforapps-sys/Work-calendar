import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".", // root เป็น project root
  publicDir: "public", // public folder
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html"), // ใช้ index.html จาก public
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // สำหรับ import JS/CSS
    },
  },
});
