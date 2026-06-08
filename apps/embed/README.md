# @n-ramos/celebrimbor-embed

A **single, self-contained bundle** that registers the `<my-page-builder>` web
component with the basic block library — ready to drop into any non-React host
such as a Laravel/Filament admin.

Everything is bundled **from source against one React instance** (see
`vite.config.ts`: aliases to each package's `src` + `dedupe: ["react", "react-dom"]`).
This avoids the dual-React problem you would hit by consuming the prebuilt
`editor-element` dist (which inlines its own React) alongside `blocks-basic`.

The build emits three files in `dist/`:

| File | Format | Use |
|------|--------|-----|
| `celebrimbor.iife.js` | IIFE | drop-in `<script src>` (CDN, Filament render hook) |
| `celebrimbor.js` | ESM | `import` / `<script type="module">` |
| `celebrimbor.css` | CSS | editor styles |

## Use it (no local build)

### CDN — the lowest-friction path

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@n-ramos/celebrimbor-embed@0.1/dist/celebrimbor.css">
<script src="https://cdn.jsdelivr.net/npm/@n-ramos/celebrimbor-embed@0.1/dist/celebrimbor.iife.js"></script>

<my-page-builder name="document" format="portable"></my-page-builder>
```

The short URL `https://cdn.jsdelivr.net/npm/@n-ramos/celebrimbor-embed` resolves
to the IIFE bundle (via the `jsdelivr` field), so a plain `<script>` works — no
`type="module"` needed.

### npm

```bash
npm i @n-ramos/celebrimbor-embed
```

```ts
import "@n-ramos/celebrimbor-embed";            // registers <my-page-builder>
import "@n-ramos/celebrimbor-embed/styles.css";
```

For Laravel/Filament specifically (CDN, `FilamentAsset`, or self-hosting), see the
[Laravel integration guide](../../docs/laravel-integration.md#monter-lediteur-dans-filament)
and [`examples/laravel-filament/`](../../examples/laravel-filament/README.md).

## Build locally

```bash
pnpm --filter @n-ramos/celebrimbor-embed build
# -> dist/celebrimbor.iife.js  +  dist/celebrimbor.js  +  dist/celebrimbor.css
```

### Offline / air-gapped: copy straight into a Laravel `public/`

A convenience for when you self-host the assets instead of using the CDN:

```bash
LARAVEL_PUBLIC=/absolute/path/to/your-laravel-app/public \
  pnpm --filter @n-ramos/celebrimbor-embed build:laravel
# copies dist/* into <public>/vendor/celebrimbor/
```

Prefer the CDN or npm paths above when you can — they give you versioning and
cache-busting for free.

## Custom blocks & custom fields

Swap `registerBasicBlocks(...)` in `src/main.ts` for your own registry to ship a
different block library, and pass `customFields` to `definePageBuilderElement`
to register `custom` field components. Rebuild (or republish) and reload.
