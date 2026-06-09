import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    controller: "src/controller.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // Keep every dependency external so AssetMapper/importmap resolves a single
  // shared copy of react, react-dom and @hotwired/stimulus. Bundling react here
  // would reintroduce the dual-React problem the embed bundle exists to avoid.
  external: [
    "react",
    "react-dom",
    "react-dom/client",
    "@hotwired/stimulus",
    "@n-ramos/celebrimbor-core",
    "@n-ramos/celebrimbor-editor-react",
    "@n-ramos/celebrimbor-editor-element",
  ],
});
