// Standalone embed entry.
//
// 1. Registers the <my-page-builder> custom element + the basic block library
//    (for the editor — Laravel/Filament, plain HTML, ...).
// 2. Exposes a server-side PREVIEW renderer: a preview page can render the same
//    blocks (single React instance) from a document, fed either by an inline
//    JSON payload or live via postMessage from the editor's preview iframe.
//
// Everything is bundled from source against one React instance (see
// vite.config.ts) to avoid the dual-React issue.

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  deserializePortableDocument,
  type PageDocument,
} from "@n-ramos/celebrimbor-core";
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { PageRenderer } from "@n-ramos/celebrimbor-editor-react";
import { definePageBuilderElement } from "@n-ramos/celebrimbor-editor-element";

import { testimonialBlock } from "./blocks/testimonial";

import "@n-ramos/celebrimbor-editor-element/styles.css";

const registry = registerBasicBlocks(createBlockRegistry());
registry.register(testimonialBlock); // example custom block

// --- Editor element -------------------------------------------------------
definePageBuilderElement({ registry });

// --- Server-side preview renderer ----------------------------------------

const PREVIEW_MESSAGE_TYPE = "celebrimbor:preview";

function toDocument(value: unknown): PageDocument | null {
  if (Array.isArray(value)) {
    return deserializePortableDocument(value as never, { version: "1.0.0" });
  }
  if (value && typeof value === "object" && Array.isArray((value as PageDocument).blocks)) {
    return value as PageDocument;
  }
  return null;
}

function mountPreview(target: string | HTMLElement = "#celebrimbor-preview") {
  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host) {
    return;
  }

  const root: Root = createRoot(host as HTMLElement);
  const render = (document_: PageDocument | null) => {
    if (document_) {
      root.render(createElement(PageRenderer, { document: document_, registry }));
    }
  };

  // Initial document from an inline <script type="application/json"> payload.
  const inline = document.getElementById("celebrimbor-document");
  if (inline?.textContent) {
    try {
      render(toDocument(JSON.parse(inline.textContent)));
    } catch {
      // ignore malformed payload
    }
  }

  // Live updates from the editor's preview iframe.
  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as { type?: string; document?: unknown } | null;
    if (data && data.type === PREVIEW_MESSAGE_TYPE) {
      render(toDocument(data.document));
    }
  });
}

const celebrimbor = { mountPreview };
(window as Window & { celebrimbor?: typeof celebrimbor }).celebrimbor = celebrimbor;

// Auto-mount when a preview root is present on the page.
function autoMount() {
  if (document.getElementById("celebrimbor-preview")) {
    mountPreview();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}
