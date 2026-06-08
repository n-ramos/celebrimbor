import type { PageDocument } from "./types";

export function serializeDocument(document: PageDocument): string {
  return JSON.stringify(document, null, 2);
}

export function deserializeDocument(value: string): PageDocument {
  return JSON.parse(value) as PageDocument;
}

export type PortableBlock = {
  _children?: PortableBlock[] | undefined;
  _id?: string | undefined;
  _name: string;
  _settings?: Record<string, unknown> | undefined;
  _visible?: boolean | undefined;
} & Record<string, unknown>;

export function serializePortableDocument(document: PageDocument): PortableBlock[] {
  return document.blocks.map(serializePortableBlock);
}

export function deserializePortableDocument(
  blocks: PortableBlock[],
  baseDocument: Partial<PageDocument> = {},
): PageDocument {
  return {
    version: baseDocument.version ?? "1.0.0",
    id: baseDocument.id,
    title: baseDocument.title,
    meta: baseDocument.meta,
    blocks: blocks.map(deserializePortableBlock),
  };
}

/**
 * Cles structurelles reservees du format portable. Tout champ de contenu
 * portant l'un de ces noms entrerait en collision : on echappe donc les cles
 * de contenu prefixees par `_` en doublant le prefixe a la serialisation, et
 * on retire un `_` a la deserialisation. Le round-trip est ainsi garanti, y
 * compris pour des cles comme `_name` ou `_meta`.
 */
function escapeContentKey(key: string): string {
  return key.startsWith("_") ? `_${key}` : key;
}

function unescapeContentKey(key: string): string {
  return key.startsWith("_") ? key.slice(1) : key;
}

function escapeContent(content: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => [escapeContentKey(key), value]),
  );
}

function unescapeContent(content: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => [unescapeContentKey(key), value]),
  );
}

function serializePortableBlock(block: PageDocument["blocks"][number]): PortableBlock {
  return compactPortableBlock({
    _children: block.children?.length ? block.children.map(serializePortableBlock) : undefined,
    _id: block.id,
    _name: block.type,
    _settings:
      block.settings && Object.keys(block.settings).length > 0
        ? structuredClone(block.settings)
        : undefined,
    _visible: block.visible ?? true,
    ...escapeContent(structuredClone(block.content)),
  });
}

function deserializePortableBlock(block: PortableBlock): PageDocument["blocks"][number] {
  const {
    _children,
    _id,
    _name,
    _settings,
    _visible,
    ...rest
  } = block;

  return {
    id: _id ?? `block_${Math.random().toString(36).slice(2, 10)}`,
    type: _name,
    content: unescapeContent(rest),
    settings: _settings ? structuredClone(_settings) : undefined,
    children: _children?.map(deserializePortableBlock),
    visible: _visible ?? true,
  };
}

function compactPortableBlock(block: PortableBlock): PortableBlock {
  return Object.fromEntries(
    Object.entries(block).filter(([, value]) => value !== undefined),
  ) as PortableBlock;
}
