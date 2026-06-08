import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (...segments: string[]) => resolve(__dirname, ...segments);

export default defineConfig({
  plugins: [react()],
  resolve: {
    // One React instance for the editor renderer AND the blocks.
    dedupe: ["react", "react-dom"],
    // Exact-match regexes so subpath imports (e.g. ".../styles.css") still
    // resolve through the package's exports (dist), not the aliased source file.
    alias: [
      { find: /^@n-ramos\/celebrimbor-core$/, replacement: r("../../packages/core/src/index.ts") },
      { find: /^@n-ramos\/celebrimbor-editor-react$/, replacement: r("../../packages/editor-react/src/index.ts") },
      { find: /^@n-ramos\/celebrimbor-editor-element$/, replacement: r("../../packages/editor-element/src/index.tsx") },
      { find: /^@n-ramos\/celebrimbor-blocks-basic$/, replacement: r("../../packages/blocks/basic/src/index.ts") },
    ],
  },
  build: {
    lib: {
      entry: r("src/main.ts"),
      formats: ["es"],
      fileName: () => "celebrimbor.js",
    },
    outDir: r("dist"),
    cssCodeSplit: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Single, predictably-named CSS file: dist/celebrimbor.css
        assetFileNames: "celebrimbor.[ext]",
      },
    },
  },
});
