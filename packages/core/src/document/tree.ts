import type { PageBlock, PageDocument } from "./types";

export type BlockLocation = {
  block: PageBlock;
  parent: PageBlock | null;
  path: number[];
};

export function findBlock(document: PageDocument, blockId: string): BlockLocation | null {
  return findBlockInCollection(document.blocks, blockId, null, []);
}

function findBlockInCollection(
  blocks: PageBlock[],
  blockId: string,
  parent: PageBlock | null,
  path: number[],
): BlockLocation | null {
  for (const [index, block] of blocks.entries()) {
    const nextPath = [...path, index];
    if (block.id === blockId) {
      return { block, parent, path: nextPath };
    }

    if (block.children?.length) {
      const found = findBlockInCollection(block.children, blockId, block, nextPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function updateBlocksAtPath(
  blocks: PageBlock[],
  path: number[],
  updater: (block: PageBlock) => PageBlock,
): PageBlock[] {
  const [head, ...tail] = path;
  if (head === undefined) {
    return blocks;
  }

  return blocks.map((block, index) => {
    if (index !== head) {
      return block;
    }

    if (tail.length === 0) {
      return updater(block);
    }

    return {
      ...block,
      children: updateBlocksAtPath(block.children ?? [], tail, updater),
    };
  });
}

export function removeBlockAtPath(blocks: PageBlock[], path: number[]): PageBlock[] {
  const [head, ...tail] = path;
  if (head === undefined) {
    return blocks;
  }

  if (tail.length === 0) {
    return blocks.filter((_, index) => index !== head);
  }

  return blocks.map((block, index) => {
    if (index !== head) {
      return block;
    }

    return {
      ...block,
      children: removeBlockAtPath(block.children ?? [], tail),
    };
  });
}

/**
 * Insere `item` dans une collection plate a l'index donne (append si `index`
 * est `undefined` ou hors borne haute). Primitive d'insertion immutable
 * partagee par `insertBlockAtPath` et les operations de document.
 */
export function insertAtIndex<TItem>(items: TItem[], index: number | undefined, item: TItem): TItem[] {
  const nextIndex = index ?? items.length;
  const cloned = [...items];
  cloned.splice(nextIndex, 0, item);
  return cloned;
}

export function insertBlockAtPath(blocks: PageBlock[], path: number[], block: PageBlock): PageBlock[] {
  if (path.length === 0) {
    return [...blocks, block];
  }

  const [head, ...tail] = path;
  const nextIndex = head ?? blocks.length;

  if (tail.length === 0) {
    return insertAtIndex(blocks, nextIndex, block);
  }

  return blocks.map((item, index) => {
    if (index !== nextIndex) {
      return item;
    }

    return {
      ...item,
      children: insertBlockAtPath(item.children ?? [], tail, block),
    };
  });
}

export function mapBlocks(blocks: PageBlock[], iteratee: (block: PageBlock) => PageBlock): PageBlock[] {
  return blocks.map((block) => ({
    ...iteratee(block),
    children: block.children ? mapBlocks(block.children, iteratee) : undefined,
  }));
}
