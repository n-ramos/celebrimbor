import { Controller } from "@hotwired/stimulus";

/**
 * Block-agnostic Stimulus controller driving a `<my-page-builder>` element.
 *
 * It registers **no** blocks: your app must call `defineCelebrimbor({ registry })`
 * (from `@n-ramos/celebrimbor-symfony`) once in its AssetMapper entry. This
 * controller only wires the element's attributes from Stimulus values and relays
 * the element's native events as namespaced `celebrimbor:*` events so you can
 * hook Turbo / Live Components.
 *
 * Registered as `celebrimbor--page-builder` (see the `symfony` key in
 * package.json). The Symfony `PageBuilderType` / Twig component emit the matching
 * `data-controller` and `data-*-value` attributes for you.
 *
 * Values:
 * - `format`      — `"portable"` (default) or `"document"`
 * - `name`        — hidden field name synced for classic form submits
 * - `value`       — initial JSON (PageDocument or portable block array)
 * - `previewUrl`  — URL embedded in the editor preview pane
 * - `tag`         — custom element tag name (default `my-page-builder`)
 *
 * Emits: `celebrimbor:change`, `celebrimbor:save` (with the element's
 * `detail.document`).
 */
export default class extends Controller<HTMLElement> {
  static override values = {
    format: { type: String, default: "portable" },
    name: String,
    value: String,
    previewUrl: String,
    tag: { type: String, default: "my-page-builder" },
  };

  declare readonly formatValue: string;
  declare readonly nameValue: string;
  declare readonly hasNameValue: boolean;
  declare readonly valueValue: string;
  declare readonly hasValueValue: boolean;
  declare readonly previewUrlValue: string;
  declare readonly hasPreviewUrlValue: boolean;
  declare readonly tagValue: string;

  #element: HTMLElement | null = null;

  #onChange = (event: Event) => {
    this.dispatch("change", { detail: (event as CustomEvent).detail, prefix: "celebrimbor" });
  };

  #onSave = (event: Event) => {
    this.dispatch("save", { detail: (event as CustomEvent).detail, prefix: "celebrimbor" });
  };

  override connect() {
    const tag = this.tagValue;

    if (!customElements.get(tag)) {
      console.warn(
        `[celebrimbor] <${tag}> is not defined. Call defineCelebrimbor({ registry }) ` +
          `from "@n-ramos/celebrimbor-symfony" in your AssetMapper entry before this controller connects.`,
      );
    }

    const element = this.#ensureElement(tag);
    this.#element = element;

    if (this.hasNameValue) {
      element.setAttribute("name", this.nameValue);
    }
    element.setAttribute("format", this.formatValue);
    if (this.hasValueValue) {
      element.setAttribute("value", this.valueValue);
    }
    if (this.hasPreviewUrlValue) {
      element.setAttribute("preview-url", this.previewUrlValue);
    }

    element.addEventListener("my-page-builder:change", this.#onChange);
    element.addEventListener("my-page-builder:save", this.#onSave);
  }

  override disconnect() {
    this.#element?.removeEventListener("my-page-builder:change", this.#onChange);
    this.#element?.removeEventListener("my-page-builder:save", this.#onSave);
    this.#element = null;
  }

  /**
   * Use the controller element itself if it is the custom element, otherwise a
   * nested one, otherwise create and append it. This lets the host put
   * `data-controller` either directly on `<my-page-builder>` or on a wrapper.
   */
  #ensureElement(tag: string): HTMLElement {
    if (this.element.matches(tag)) {
      return this.element;
    }

    const nested = this.element.querySelector<HTMLElement>(tag);
    if (nested) {
      return nested;
    }

    const created = document.createElement(tag);
    this.element.appendChild(created);
    return created;
  }
}
