import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".", // project root
  build: {
    outDir: "dist",       // build output
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html"), // ใช้ index.html จาก public
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // shortcut สำหรับ import JS/CSS
    },
  },
});
