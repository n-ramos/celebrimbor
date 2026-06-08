import type { ReactNode } from "react";
import type { BlockRegistry, PageBlock, PageDocument } from "@n-ramos/celebrimbor-core";

export type PageRendererProps = {
  document: PageDocument;
  registry: BlockRegistry;
  unknownBlockFallback?: (block: PageBlock) => ReactNode;
  blockWrapper?: (block: PageBlock, content: ReactNode) => ReactNode;
};

export function PageRenderer({
  document,
  registry,
  unknownBlockFallback,
  blockWrapper,
}: PageRendererProps) {
  return (
    <>
      {document.blocks
        .filter((block) => block.visible ?? true)
        .map((block) => (
          <div key={block.id}>{renderBlock(block, registry, unknownBlockFallback, blockWrapper)}</div>
        ))}
    </>
  );
}

function renderBlock(
  block: PageBlock,
  registry: BlockRegistry,
  unknownBlockFallback?: (block: PageBlock) => ReactNode,
  blockWrapper?: (block: PageBlock, content: ReactNode) => ReactNode,
): ReactNode {
  const definition = registry.get(block.type);
  const children = (block.children ?? [])
    .filter((child) => child.visible ?? true)
    .map((child) => renderBlock(child, registry, unknownBlockFallback, blockWrapper));

  const content = definition?.render
    ? (definition.render({
        block,
        children: (block.children ?? []).map((child) => ({
          block: child,
          children: [],
        })),
      }) as ReactNode)
    : unknownBlockFallback?.(block) ?? (
        <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Unknown block: {block.type}
        </div>
      );

  if (children.length === 0) {
    return blockWrapper ? blockWrapper(block, content) : content;
  }

  return blockWrapper ? blockWrapper(block, <>{content}{children}</>) : <>{content}{children}</>;
}
