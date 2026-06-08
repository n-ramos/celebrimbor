import type { AnyBlockDefinition } from "../block/types";
import type { PageBlock, PageDocument } from "../document/types";
import type { BlockRegistry } from "../registry/create-block-registry";

export type RenderStrategy<TOutput> = (args: {
  block: PageBlock;
  definition: AnyBlockDefinition | undefined;
  children: TOutput[];
}) => TOutput;

export function renderDocument<TOutput>(
  document: PageDocument,
  registry: BlockRegistry,
  strategy: RenderStrategy<TOutput>,
): TOutput[] {
  return document.blocks
    .filter((block) => block.visible ?? true)
    .map((block) => renderBlock(block, registry, strategy));
}

function renderBlock<TOutput>(
  block: PageBlock,
  registry: BlockRegistry,
  strategy: RenderStrategy<TOutput>,
): TOutput {
  const definition = registry.get(block.type);
  const children = (block.children ?? [])
    .filter((child) => child.visible ?? true)
    .map((child) => renderBlock(child, registry, strategy));

  return strategy({
    block,
    definition,
    children,
  });
}
