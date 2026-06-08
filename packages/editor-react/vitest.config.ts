import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@n-ramos/celebrimbor-core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.tsx"],
  },
});
