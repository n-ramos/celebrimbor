import {
  definePageBuilderElement,
  type PageBuilderElementOptions,
} from "@n-ramos/celebrimbor-editor-element";

export type DefineCelebrimborOptions = PageBuilderElementOptions;

/**
 * Define the `<my-page-builder>` custom element with **your** block registry.
 *
 * The Symfony adapter ships no blocks on purpose: you keep full control of the
 * block library (your "JS builder system"). Call this once from your AssetMapper
 * entry (e.g. `assets/app.js`) before the Stimulus controller connects:
 *
 * ```js
 * import { defineCelebrimbor } from "@n-ramos/celebrimbor-symfony";
 * import { createBlockRegistry } from "@n-ramos/celebrimbor-core";
 *
 * const registry = createBlockRegistry();
 * // registry.register(myHeroBlock); ...
 *
 * defineCelebrimbor({ registry });
 * ```
 *
 * It is a thin, Symfony-branded wrapper over `definePageBuilderElement` and
 * accepts the exact same options (registry, customFields, assetPicker, storage,
 * onSave, previewUrl, tagName, ...). Calling it twice with the same `tagName` is
 * a no-op — the already-registered element class is returned.
 */
export function defineCelebrimbor(options: DefineCelebrimborOptions) {
  return definePageBuilderElement(options);
}
