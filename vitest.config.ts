import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

// Same asset handling as vite.config.ts so the whole App can be rendered in tests.
const figmaAssets = () => ({
  name: "figma-asset-resolver",
  resolveId(id: string) { if (id.startsWith("figma:asset/")) return path.resolve(__dirname, "src/assets", id.replace("figma:asset/", "")); },
});
export default defineConfig({
  plugins: [react(), figmaAssets()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"], include: ["src/**/*.test.{ts,tsx}"] },
});
