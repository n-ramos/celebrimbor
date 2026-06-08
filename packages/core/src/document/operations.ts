import type { AnyBlockDefinition } from "../block/types";
import { createBlockFromDefinition } from "./factories";
import { findBlock, insertAtIndex, removeBlockAtPath, updateBlocksAtPath } from "./tree";
import type {
  BlockInsertPosition,
  BlockMovePosition,
  PageBlock,
  PageDocument,
} from "./types";
import type { BlockRegistry } from "../registry/create-block-registry";

export function addBlock(
  document: PageDocument,
  blockOrDefinition: string | AnyBlockDefinition | PageBlock,
  position: BlockInsertPosition = {},
  registry?: Pick<BlockRegistry, "get">,
): PageDocument {
  const block = resolveBlock(blockOrDefinition, registry);

  if (position.parentId) {
    const parentLocation = findBlock(document, position.parentId);
    if (!parentLocation) {
      throw new Error(`Parent block "${position.parentId}" not found.`);
    }

    return {
      ...document,
      blocks: updateBlocksAtPath(document.blocks, parentLocation.path, (parent) => ({
        ...parent,
        children: insertAtIndex(parent.children ?? [], position.index, block),
      })),
    };
  }

  return {
    ...document,
    blocks: insertAtIndex(document.blocks, position.index, block),
  };
}

export function updateBlock(
  document: PageDocument,
  blockId: string,
  patch: Partial<PageBlock>,
): PageDocument {
  const location = findBlock(document, blockId);
  if (!location) {
    return document;
  }

  return {
    ...document,
    blocks: updateBlocksAtPath(document.blocks, location.path, (block) => ({
      ...block,
      ...structuredClone(patch),
    })),
  };
}

export function removeBlock(document: PageDocument, blockId: string): PageDocument {
  const location = findBlock(document, blockId);
  if (!location) {
    return document;
  }

  return {
    ...document,
    blocks: removeBlockAtPath(document.blocks, location.path),
  };
}

export function duplicateBlock(document: PageDocument, blockId: string): PageDocument {
  const location = findBlock(document, blockId);
  if (!location) {
    return document;
  }

  const clonedBlock = duplicateBlockNode(location.block);
  const targetIndex = location.path.at(-1);
  const siblingPath = location.path.slice(0, -1);

  if (targetIndex === undefined) {
    return document;
  }

  if (siblingPath.length === 0) {
    return {
      ...document,
      blocks: insertAtIndex(document.blocks, targetIndex + 1, clonedBlock),
    };
  }

  return {
    ...document,
    blocks: updateBlocksAtPath(document.blocks, siblingPath, (parent) => ({
      ...parent,
      children: insertAtIndex(parent.children ?? [], targetIndex + 1, clonedBlock),
    })),
  };
}

export function toggleBlockVisibility(document: PageDocument, blockId: string): PageDocument {
  const location = findBlock(document, blockId);
  if (!location) {
    return document;
  }

  return {
    ...document,
    blocks: updateBlocksAtPath(document.blocks, location.path, (block) => ({
      ...block,
      visible: !(block.visible ?? true),
    })),
  };
}

export function moveBlock(
  document: PageDocument,
  blockId: string,
  targetPosition: BlockMovePosition,
): PageDocument {
  const location = findBlock(document, blockId);
  if (!location) {
    return document;
  }

  const removed = removeBlock(document, blockId);
  // A move must preserve the identity of the block (and of its descendants):
  // selection state and any external reference rely on stable ids. Cloning
  // without regenerating ids keeps the operation immutable yet identity-safe.
  const block = structuredClone(location.block);

  if (targetPosition.parentId) {
    const parentLocation = findBlock(removed, targetPosition.parentId);
    if (!parentLocation) {
      throw new Error(`Target parent "${targetPosition.parentId}" not found.`);
    }

    return {
      ...removed,
      blocks: updateBlocksAtPath(removed.blocks, parentLocation.path, (parent) => ({
        ...parent,
        children: insertAtIndex(parent.children ?? [], targetPosition.index, block),
      })),
    };
  }

  return {
    ...removed,
    blocks: insertAtIndex(removed.blocks, targetPosition.index, block),
  };
}

function duplicateBlockNode(block: PageBlock): PageBlock {
  return {
    ...structuredClone(block),
    id: createDerivedId(block.id),
    children: block.children?.map(duplicateBlockNode),
  };
}

function createDerivedId(baseId: string): string {
  return `${baseId}_copy_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBlock(
  blockOrDefinition: string | AnyBlockDefinition | PageBlock,
  registry?: Pick<BlockRegistry, "get">,
): PageBlock {
  if (typeof blockOrDefinition === "string") {
    const definition = registry?.get(blockOrDefinition);
    if (!definition) {
      throw new Error(`Block type "${blockOrDefinition}" is not registered.`);
    }

    return createBlockFromDefinition(definition);
  }

  if ("schema" in blockOrDefinition) {
    return createBlockFromDefinition(blockOrDefinition);
  }

  return structuredClone(blockOrDefinition);
}
