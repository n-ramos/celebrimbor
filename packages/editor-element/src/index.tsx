import { createRoot, type Root } from "react-dom/client";
import {
  createDocument,
  type AssetPickerAdapter,
  type BlockRegistry,
  type PageBuilderStorage,
  type PageDocument,
  deserializePortableDocument,
  serializePortableDocument,
  type PortableBlock,
} from "@n-ramos/celebrimbor-core";
import { PageBuilder } from "@n-ramos/celebrimbor-editor-react";

export type PageBuilderElementOptions = {
  registry: BlockRegistry;
  storage?: PageBuilderStorage | undefined;
  assetPicker?: AssetPickerAdapter | undefined;
  onSave?: ((document: PageDocument) => Promise<void>) | undefined;
  createInitialDocument?: (() => PageDocument) | undefined;
  tagName?: string | undefined;
};

type RuntimeOptions = Omit<PageBuilderElementOptions, "tagName">;

export type PageBuilderElementChangeDetail = {
  document: PageDocument;
};

export class PageBuilderElement extends HTMLElement {
  static observedAttributes = ["format", "name", "value"];

  static defaultOptions?: RuntimeOptions;

  #hiddenInput: HTMLTextAreaElement | null = null;
  #mountPoint: HTMLDivElement | null = null;
  #pageDocument: PageDocument | null = null;
  #reactRoot: Root | null = null;
  #runtimeOptions: Partial<RuntimeOptions> = {};

  connectedCallback() {
    if (!this.style.display) {
      this.style.display = "block";
    }

    this.#ensureNodes();
    this.#render();
  }

  disconnectedCallback() {
    this.#reactRoot?.unmount();
    this.#reactRoot = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) {
      return;
    }

    if (name === "name") {
      this.#syncHiddenInput();
      return;
    }

    if (name === "format") {
      this.#syncHiddenInput();
      this.#render();
      return;
    }

    if (name === "value") {
      this.#pageDocument = parseDocument(newValue, this.#createInitialDocument());
      this.#syncHiddenInput();
      this.#render();
    }
  }

  get assetPicker() {
    return this.#runtimeOptions.assetPicker ?? this.#defaults().assetPicker;
  }

  set assetPicker(value: AssetPickerAdapter | undefined) {
    if (value === undefined) {
      delete this.#runtimeOptions.assetPicker;
    } else {
      this.#runtimeOptions.assetPicker = value;
    }
    this.#render();
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    if (!value) {
      this.removeAttribute("name");
      return;
    }

    this.setAttribute("name", value);
  }

  get format() {
    return this.getAttribute("format") === "document" ? "document" : "portable";
  }

  set format(value: "document" | "portable") {
    this.setAttribute("format", value);
  }

  get onSave() {
    return this.#runtimeOptions.onSave ?? this.#defaults().onSave;
  }

  set onSave(value: ((document: PageDocument) => Promise<void>) | undefined) {
    if (value === undefined) {
      delete this.#runtimeOptions.onSave;
    } else {
      this.#runtimeOptions.onSave = value;
    }
    this.#render();
  }

  get pageDocument(): PageDocument {
    return structuredClone(this.#getDocument());
  }

  set pageDocument(value: PageDocument) {
    this.#pageDocument = structuredClone(value);
    this.#syncHiddenInput();
    this.#render();
  }

  get registry() {
    return this.#runtimeOptions.registry ?? this.#defaults().registry;
  }

  set registry(value: BlockRegistry | undefined) {
    if (value === undefined) {
      delete this.#runtimeOptions.registry;
    } else {
      this.#runtimeOptions.registry = value;
    }
    this.#render();
  }

  get storage() {
    return this.#runtimeOptions.storage ?? this.#defaults().storage;
  }

  set storage(value: PageBuilderStorage | undefined) {
    if (value === undefined) {
      delete this.#runtimeOptions.storage;
    } else {
      this.#runtimeOptions.storage = value;
    }
    this.#render();
  }

  get value() {
    return this.#serializeValue(this.#getDocument());
  }

  set value(nextValue: string) {
    this.setAttribute("value", nextValue);
  }

  #createInitialDocument() {
    return (
      this.#runtimeOptions.createInitialDocument?.() ??
      this.#defaults().createInitialDocument?.() ??
      createDocument()
    );
  }

  #defaults(): RuntimeOptions {
    return (this.constructor as typeof PageBuilderElement).defaultOptions ?? ({} as RuntimeOptions);
  }

  #dispatch(type: string, document: PageDocument) {
    this.dispatchEvent(
      new CustomEvent<PageBuilderElementChangeDetail>(type, {
        bubbles: true,
        detail: {
          document: structuredClone(document),
        },
      }),
    );
  }

  #ensureNodes() {
    if (this.#hiddenInput && this.#mountPoint && this.#reactRoot) {
      return;
    }

    this.#hiddenInput = document.createElement("textarea");
    this.#hiddenInput.hidden = true;

    this.#mountPoint = document.createElement("div");
    this.#mountPoint.dataset.pageBuilderMount = "true";

    this.replaceChildren(this.#hiddenInput, this.#mountPoint);
    this.#reactRoot = createRoot(this.#mountPoint);
    this.#syncHiddenInput();
  }

  #getDocument() {
    return this.#pageDocument ?? parseDocument(this.getAttribute("value"), this.#createInitialDocument());
  }

  #handleChange = (document: PageDocument) => {
    this.#pageDocument = structuredClone(document);
    this.#syncHiddenInput();
    this.#dispatch("my-page-builder:change", document);
    this.#render();
  };

  #handleSave = async (document: PageDocument) => {
    const save = this.onSave ?? this.storage?.save?.bind(this.storage);
    if (!save) {
      return;
    }

    await save(document);
    this.#dispatch("my-page-builder:save", document);
  };

  #render() {
    if (!this.isConnected) {
      return;
    }

    this.#ensureNodes();
    if (!this.#reactRoot || !this.#mountPoint) {
      return;
    }

    const registry = this.registry;
    if (!registry) {
      this.#reactRoot.render(
        <div className="mpb-theme rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          A block registry is required to mount the page builder element.
        </div>,
      );
      return;
    }

    this.#reactRoot.render(
      <PageBuilder
        assetPicker={this.assetPicker}
        document={this.#getDocument()}
        onChange={this.#handleChange}
        onSave={this.onSave || this.storage?.save ? this.#handleSave : undefined}
        registry={registry}
        storage={this.storage}
      />,
    );
  }

  #syncHiddenInput() {
    if (!this.#hiddenInput) {
      return;
    }

    this.#hiddenInput.name = this.name;
    this.#hiddenInput.value = this.#serializeValue(this.#getDocument());
  }

  #serializeValue(document: PageDocument) {
    if (this.format === "document") {
      return JSON.stringify(document);
    }

    return JSON.stringify(serializePortableDocument(document));
  }
}

export function definePageBuilderElement(options: PageBuilderElementOptions) {
  const tagName = options.tagName ?? "my-page-builder";
  const existing = customElements.get(tagName);
  if (existing) {
    return existing as typeof PageBuilderElement;
  }

  class ConfiguredPageBuilderElement extends PageBuilderElement {
    static override defaultOptions = {
      assetPicker: options.assetPicker,
      createInitialDocument: options.createInitialDocument,
      onSave: options.onSave,
      registry: options.registry,
      storage: options.storage,
    } satisfies RuntimeOptions;
  }

  customElements.define(tagName, ConfiguredPageBuilderElement);
  return ConfiguredPageBuilderElement;
}

function parseDocument(value: string | null, fallback: PageDocument): PageDocument {
  if (!value) {
    return structuredClone(fallback);
  }

  try {
    const parsed = JSON.parse(value) as PageDocument | PortableBlock[];
    if (Array.isArray(parsed)) {
      return deserializePortableDocument(parsed, {
        version: fallback.version,
        id: fallback.id,
        title: fallback.title,
        meta: fallback.meta,
      });
    }

    if (Array.isArray(parsed.blocks)) {
      return parsed;
    }

    return structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}
