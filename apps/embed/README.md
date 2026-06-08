# @n-ramos/celebrimbor-embed

Builds a **single, self-contained bundle** that registers the
`<my-page-builder>` web component with the basic block library — ready to drop
into a non-React host such as a Laravel/Filament admin.

Everything is bundled **from source against one React instance** (see
`vite.config.ts`: aliases to each package's `src` + `dedupe: ["react", "react-dom"]`).
This avoids the dual-React problem you would hit by consuming the prebuilt
`editor-element` dist (which inlines its own React) alongside `blocks-basic`.

## Build

```bash
pnpm --filter @n-ramos/celebrimbor-embed build
# -> dist/celebrimbor.js  +  dist/celebrimbor.css
```

## Deploy into a Laravel app

```bash
# from the monorepo root
LARAVEL_PUBLIC=/absolute/path/to/your-laravel-app/public \
  pnpm --filter @n-ramos/celebrimbor-embed build:laravel
# copies into <public>/vendor/celebrimbor/{celebrimbor.js,celebrimbor.css}
```

Then load both files in the Filament panel (render hook) — see
`n-ramos/celebrimbor-filament-plugin` → `examples/laravel/`.

## Custom blocks

Swap `registerBasicBlocks(...)` in `src/main.ts` for your own registry to ship
a different block library. Rebuild and redeploy.
