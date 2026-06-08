import type { BlockDefinition } from "../block/types";
import type { PageBlock, PageDocument } from "./types";
import { CURRENT_DOCUMENT_VERSION } from "./constants";

export function createDocument(input: Partial<PageDocument> = {}): PageDocument {
  return compactOptionalProperties({
    version: input.version ?? CURRENT_DOCUMENT_VERSION,
    id: input.id,
    title: input.title,
    blocks: input.blocks ? structuredClone(input.blocks) : [],
    meta: input.meta ? structuredClone(input.meta) : {},
  });
}

export function createBlockFromDefinition<TContent, TSettings>(
  definition: BlockDefinition<TContent, TSettings>,
  overrides: Partial<PageBlock<TContent, TSettings>> = {},
): PageBlock<TContent, TSettings> {
  return compactOptionalProperties({
    id: overrides.id ?? cryptoRandomId(),
    type: definition.type,
    content: structuredClone(overrides.content ?? definition.defaultContent),
    settings: structuredClone(overrides.settings ?? definition.defaultSettings),
    children: structuredClone(overrides.children ?? []),
    visible: overrides.visible ?? true,
  });
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `block_${Math.random().toString(36).slice(2, 10)}`;
}

function compactOptionalProperties<TValue extends Record<string, unknown>>(value: TValue): TValue {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as TValue;
}
