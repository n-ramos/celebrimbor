import { defineConfig } from "vitest/config";

// Configuration racine: agrege les projets par package (chacun garde son env
// node/jsdom) et centralise les reglages de couverture.
export default defineConfig({
  test: {
    projects: [
      "packages/*/vitest.config.ts",
      "packages/*/*/vitest.config.ts",
      "apps/*/vitest.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**", "packages/*/*/src/**"],
      exclude: [
        "**/dist/**",
        "**/tests/**",
        "**/*.config.*",
        "**/stories/**",
        "**/*.stories.*",
        "**/index.ts",
        "**/types.ts",
      ],
    },
  },
});
