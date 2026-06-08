import { useEffect, useMemo, useState } from "react";
import {
  addBlock,
  duplicateBlock,
  moveBlock,
  removeBlock,
  toggleBlockVisibility,
  updateBlock,
} from "@n-ramos/celebrimbor-core";
import type { BlockDefinition, PageDocument } from "@n-ramos/celebrimbor-core";
import type { PageBuilderProps } from "../types";

export function usePageBuilder({
  document,
  onChange,
  onSave,
  selectedBlockId,
  onSelectBlock,
}: Pick<
  PageBuilderProps,
  "document" | "onChange" | "onSave" | "selectedBlockId" | "onSelectBlock"
>) {
  const [saving, setSaving] = useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(selectedBlockId);
  const selectedId = selectedBlockId ?? internalSelectedId;

  const selectedBlock = useMemo(
    () => document.blocks.flatMap(flattenBlocks).find((block) => block.id === selectedId),
    [document.blocks, selectedId],
  );

  useEffect(() => {
    if (selectedBlockId !== undefined) {
      setInternalSelectedId(selectedBlockId);
    }
  }, [selectedBlockId]);

  useEffect(() => {
    if (selectedId && !selectedBlock) {
      setInternalSelectedId(undefined);
    }
  }, [document.blocks, selectedBlock, selectedId]);

  return {
    selectedId,
    selectedBlock,
    saving,
    selectBlock(blockId?: string) {
      if (selectedBlockId === undefined) {
        setInternalSelectedId(blockId);
      }
      onSelectBlock?.(blockId);
    },
    add(definition: BlockDefinition) {
      const nextDocument = addBlock(document, definition);
      onChange(nextDocument);
      const nextSelectedId = nextDocument.blocks.at(-1)?.id;
      if (nextSelectedId) {
        if (selectedBlockId === undefined) {
          setInternalSelectedId(nextSelectedId);
        }
        onSelectBlock?.(nextSelectedId);
      }
    },
    insert(definition: BlockDefinition, index: number) {
      const nextDocument = addBlock(document, definition, { index });
      onChange(nextDocument);
      const nextSelectedId = nextDocument.blocks[index]?.id;
      if (nextSelectedId) {
        if (selectedBlockId === undefined) {
          setInternalSelectedId(nextSelectedId);
        }
        onSelectBlock?.(nextSelectedId);
      }
    },
    updateContent(blockId: string, content: Record<string, unknown>) {
      onChange(updateBlock(document, blockId, { content }));
    },
    updateSettings(blockId: string, settings: Record<string, unknown>) {
      onChange(updateBlock(document, blockId, { settings }));
    },
    remove(blockId: string) {
      onChange(removeBlock(document, blockId));
      if (selectedId === blockId) {
        if (selectedBlockId === undefined) {
          setInternalSelectedId(undefined);
        }
        onSelectBlock?.(undefined);
      }
    },
    duplicate(blockId: string) {
      onChange(duplicateBlock(document, blockId));
    },
    toggleVisibility(blockId: string) {
      onChange(toggleBlockVisibility(document, blockId));
    },
    move(blockId: string, index: number) {
      onChange(moveBlock(document, blockId, { index }));
    },
    async save() {
      if (!onSave) {
        return;
      }

      setSaving(true);
      try {
        await onSave(document);
      } finally {
        setSaving(false);
      }
    },
  };
}

function flattenBlocks(block: import("@n-ramos/celebrimbor-core").PageBlock): import("@n-ramos/celebrimbor-core").PageBlock[] {
  return [block, ...(block.children?.flatMap(flattenBlocks) ?? [])];
}
