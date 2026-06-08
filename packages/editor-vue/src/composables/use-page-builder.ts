import { computed, ref, type Ref } from "vue";
import {
  addBlock,
  duplicateBlock,
  moveBlock,
  removeBlock,
  toggleBlockVisibility,
  updateBlock,
  type BlockDefinition,
  type PageBlock,
  type PageDocument,
} from "@n-ramos/core";

function flatten(block: PageBlock): PageBlock[] {
  return [block, ...(block.children?.flatMap(flatten) ?? [])];
}

/**
 * Composable Vue equivalent au hook React `usePageBuilder`. Il opere sur le
 * `PageDocument` courant (lu via `doc`, un Ref/computed) et notifie l'appelant
 * de chaque mutation via `onChange`, en restant totalement immutable grace aux
 * operations du core. La selection est geree localement.
 */
export function usePageBuilder(doc: Ref<PageDocument>, onChange: (next: PageDocument) => void) {
  const selectedId = ref<string | undefined>(undefined);

  const selectedBlock = computed(() =>
    doc.value.blocks.flatMap(flatten).find((block) => block.id === selectedId.value),
  );

  function commit(next: PageDocument) {
    onChange(next);
  }

  return {
    selectedId,
    selectedBlock,
    select(blockId?: string) {
      selectedId.value = blockId;
    },
    add(definition: BlockDefinition) {
      const next = addBlock(doc.value, definition);
      commit(next);
      selectedId.value = next.blocks.at(-1)?.id;
    },
    updateContent(blockId: string, content: Record<string, unknown>) {
      commit(updateBlock(doc.value, blockId, { content }));
    },
    updateSettings(blockId: string, settings: Record<string, unknown>) {
      commit(updateBlock(doc.value, blockId, { settings }));
    },
    remove(blockId: string) {
      commit(removeBlock(doc.value, blockId));
      if (selectedId.value === blockId) {
        selectedId.value = undefined;
      }
    },
    duplicate(blockId: string) {
      commit(duplicateBlock(doc.value, blockId));
    },
    toggleVisibility(blockId: string) {
      commit(toggleBlockVisibility(doc.value, blockId));
    },
    move(blockId: string, index: number) {
      commit(moveBlock(doc.value, blockId, { index }));
    },
  };
}
