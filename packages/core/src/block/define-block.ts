import type { BlockDefinition } from "./types";

export function defineBlock<TContent, TSettings = Record<string, unknown>>(
  definition: BlockDefinition<TContent, TSettings>,
): BlockDefinition<TContent, TSettings> {
  return definition;
}
