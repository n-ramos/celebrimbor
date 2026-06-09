import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  deserializePortableDocument,
  type BlockRegistry,
  type PageDocument,
  type PortableBlock,
} from "@n-ramos/celebrimbor-core";
import { PageRenderer } from "@n-ramos/celebrimbor-editor-react";

/**
 * postMessage type emitted by the editor's preview iframe and consumed by
 * {@link mountCelebrimborPreview} for live updates. Matches the channel used by
 * the standalone embed bundle so a Symfony preview page is interchangeable.
 */
export const CELEBRIMBOR_PREVIEW_MESSAGE = "celebrimbor:preview";

export type MountCelebrimborPreviewOptions = {
  /** Your block registry — the same blocks the editor was defined with. */
  registry: BlockRegistry;
  /** Mount point. Default: `#celebrimbor-preview`. */
  target?: string | HTMLElement;
  /**
   * Id of an inline `<script type="application/json">` holding the initial
   * document (PageDocument or a portable block array). Default:
   * `celebrimbor-document`. This is what a Symfony preview controller renders.
   */
  inlineId?: string;
};

export type CelebrimborPreviewHandle = {
  /** Render an explicit document (PageDocument or portable block array). */
  render(value: unknown): void;
  /** Unmount the React root and stop listening to postMessage updates. */
  destroy(): void;
};

function toDocument(value: unknown): PageDocument | null {
  if (Array.isArray(value)) {
    return deserializePortableDocument(value as PortableBlock[], { version: "1.0.0" });
  }
  if (value && typeof value === "object" && Array.isArray((value as PageDocument).blocks)) {
    return value as PageDocument;
  }
  return null;
}

/**
 * Mount a server-side preview renderer using **your** registry — the same JS
 * renderer the editor uses, so the preview is faithful to production with no
 * duplicated PHP block rendering.
 *
 * Pairs with a Symfony preview controller that renders an inline JSON payload
 * (strategy B in the integration docs). It seeds from that inline payload and
 * then accepts live updates via `postMessage` from the editor preview iframe.
 *
 * ```js
 * import { mountCelebrimborPreview } from "@n-ramos/celebrimbor-symfony";
 * mountCelebrimborPreview({ registry });
 * ```
 */
export function mountCelebrimborPreview(
  options: MountCelebrimborPreviewOptions,
): CelebrimborPreviewHandle | null {
  const { registry, target = "#celebrimbor-preview", inlineId = "celebrimbor-document" } = options;

  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host) {
    return null;
  }

  const root: Root = createRoot(host as HTMLElement);

  const render = (value: unknown) => {
    const document_ = toDocument(value);
    if (document_) {
      root.render(createElement(PageRenderer, { document: document_, registry }));
    }
  };

  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string; document?: unknown } | null;
    if (data && data.type === CELEBRIMBOR_PREVIEW_MESSAGE) {
      render(data.document);
    }
  };

  // Seed from the inline payload rendered by the Symfony preview controller.
  const inline = document.getElementById(inlineId);
  if (inline?.textContent) {
    try {
      render(JSON.parse(inline.textContent));
    } catch {
      // ignore malformed payload — live updates may still arrive
    }
  }

  window.addEventListener("message", onMessage);

  return {
    render,
    destroy() {
      window.removeEventListener("message", onMessage);
      root.unmount();
    },
  };
}
