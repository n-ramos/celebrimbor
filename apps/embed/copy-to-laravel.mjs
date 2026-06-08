// Copies the built embed bundle into a Laravel app's public dir.
//
// Usage:
//   LARAVEL_PUBLIC=/path/to/app/public pnpm --filter @n-ramos/celebrimbor-embed build:laravel
//   # or
//   node copy-to-laravel.mjs /path/to/app/public

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "dist");

const target = process.argv[2] ?? process.env.LARAVEL_PUBLIC;
if (!target) {
  console.error(
    "Missing target. Pass the Laravel public/ path as an argument or via LARAVEL_PUBLIC."
  );
  process.exit(1);
}

const outDir = resolve(target, "vendor/celebrimbor");
mkdirSync(outDir, { recursive: true });

for (const file of ["celebrimbor.js", "celebrimbor.css"]) {
  const from = resolve(dist, file);
  if (!existsSync(from)) {
    console.warn(`Skipped ${file} (not found — did the build emit it?)`);
    continue;
  }
  cpSync(from, resolve(outDir, file));
  console.log(`Copied ${file} -> ${outDir}/${file}`);
}
