import type { PageBlock, PageDocument } from "../document/types";
import type { BlockRegistry } from "../registry/create-block-registry";
import { renderDocument } from "./render-document";

export type HtmlRenderContext = {
  block: PageBlock;
  /** HTML deja rendu des enfants visibles, dans l'ordre. */
  childrenHtml: string;
};

export type HtmlBlockRenderer = (context: HtmlRenderContext) => string;

export type HtmlRenderOptions = {
  /** Renderers HTML par type de bloc (prioritaires sur `definition.renderHtml`). */
  renderers?: Record<string, HtmlBlockRenderer>;
  /** Repli applique quand aucun renderer specifique n'est trouve. */
  fallback?: HtmlBlockRenderer;
};

/**
 * Rendu HTML headless d'un document, sous forme de chaine, **sans dependance
 * React ni DOM**. Reutilise `renderDocument` et resout, pour chaque bloc, le
 * renderer dans cet ordre : `options.renderers[type]` -> `definition.renderHtml`
 * -> `options.fallback` -> repli par defaut.
 *
 * Les blocs invisibles (et leurs enfants invisibles) sont ignores.
 */
export function renderDocumentToHtml(
  document: PageDocument,
  registry: BlockRegistry,
  options: HtmlRenderOptions = {},
): string {
  const parts = renderDocument<string>(document, registry, ({ block, definition, children }) => {
    const childrenHtml = children.join("");
    const renderer = options.renderers?.[block.type] ?? definition?.renderHtml ?? options.fallback ?? defaultHtmlRenderer;
    return renderer({ block, childrenHtml });
  });

  return parts.join("");
}

function defaultHtmlRenderer({ block, childrenHtml }: HtmlRenderContext): string {
  const text = collectText(block.content);
  return `<div data-block-type="${escapeHtmlAttribute(block.type)}" data-block-id="${escapeHtmlAttribute(block.id)}">${escapeHtml(text)}${childrenHtml}</div>`;
}

function collectText(content: unknown): string {
  if (typeof content === "string" || typeof content === "number") {
    return String(content);
  }

  if (Array.isArray(content)) {
    return content.map(collectText).filter(Boolean).join(" ");
  }

  if (content && typeof content === "object") {
    return Object.values(content).map(collectText).filter(Boolean).join(" ");
  }

  return "";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
