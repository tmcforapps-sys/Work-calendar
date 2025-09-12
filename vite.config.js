import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".", // project root
  publicDir: "public", // static files เช่น favicon, index.html
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // import JS/CSS จาก src
    },
  },
});
