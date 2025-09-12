import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public",          // ชี้ไป folder ที่มี index.html
  build: {
    outDir: path.resolve(__dirname, "dist"), // build output
    emptyOutDir: true
  }
});
