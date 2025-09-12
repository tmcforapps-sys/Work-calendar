import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html")
    }
  }
});
