# @n-ramos/celebrimbor-symfony

Symfony UX / Stimulus adapter for the [Celebrimbor](../../../README.md) headless
page builder. It wires the `<my-page-builder>` web component and its live preview
into a Symfony app via **AssetMapper / importmap**, the framework-agnostic way.

It ships **no blocks**: you bring your own registry (your "JS builder system").
The editor, core and renderer come from the published Celebrimbor packages and
are kept external so importmap resolves a single shared copy of React — no
dual-React bundling.

> The PHP side (FormType, Twig component, Doctrine interface/trait, preview
> service) lives in the separate Composer bundle `n-ramos/celebrimbor-bundle`.
> This package is only the JavaScript half.

## Install (AssetMapper / importmap)

```bash
php bin/console importmap:require @n-ramos/celebrimbor-symfony
```

This pulls the adapter together with its dependencies (`@hotwired/stimulus`,
`react`, `react-dom`, and the Celebrimbor editor packages).

## Wire your blocks

The adapter does not know your blocks. Define the element once in your entry,
e.g. `assets/app.js`:

```js
import { defineCelebrimbor } from "@n-ramos/celebrimbor-symfony";
import "@n-ramos/celebrimbor-symfony/styles.css";
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";

const registry = createBlockRegistry();
// registry.register(myHeroBlock);
// registry.register(myFaqBlock);

defineCelebrimbor({ registry });
```

The Stimulus controller (`celebrimbor--page-builder`) auto-registers through the
`symfony` key in `package.json`. The PHP bundle's `PageBuilderType` / Twig
component emit the matching `data-controller` and `data-*-value` attributes, so
you normally never write them by hand. If you do it manually:

```html
<div
  data-controller="celebrimbor--page-builder"
  data-celebrimbor--page-builder-name-value="page[document]"
  data-celebrimbor--page-builder-format-value="portable"
  data-celebrimbor--page-builder-preview-url-value="/admin/pages/1/preview"
></div>
```

## Controller reference

Values:

| value        | default            | purpose                                            |
| ------------ | ------------------ | -------------------------------------------------- |
| `format`     | `portable`         | `portable` or `document` serialization             |
| `name`       | —                  | hidden field name for classic form submits         |
| `value`      | —                  | initial JSON (PageDocument or portable block array)|
| `previewUrl` | —                  | URL embedded in the editor preview pane            |
| `tag`        | `my-page-builder`  | custom element tag name                            |

Emits `celebrimbor:change` and `celebrimbor:save` (carrying `detail.document`)
for Turbo / Live Components.

## Preview

Pair a Symfony preview controller (rendering an inline JSON payload) with the
preview helper — the same JS renderer the editor uses, so previews are faithful
to production with no duplicated PHP block rendering:

```js
import { mountCelebrimborPreview } from "@n-ramos/celebrimbor-symfony";
import { registry } from "./registry";

mountCelebrimborPreview({ registry });
```

It seeds from an inline `<script type="application/json" id="celebrimbor-document">`
and then accepts live updates via `postMessage` from the editor preview iframe.

## API

- `defineCelebrimbor(options)` — define `<my-page-builder>` with your registry.
- `mountCelebrimborPreview(options)` — mount the preview renderer.
- `CELEBRIMBOR_PREVIEW_MESSAGE` — the postMessage type for live preview updates.
- default export of `@n-ramos/celebrimbor-symfony/controller` — the Stimulus controller.
