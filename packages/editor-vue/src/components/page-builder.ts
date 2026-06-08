import { computed, defineComponent, h, type PropType } from "vue";
import type { BlockRegistry, PageDocument } from "@n-ramos/celebrimbor-core";
import { usePageBuilder } from "../composables/use-page-builder";
import { BlockInspector } from "./block-inspector";
import { PageRenderer } from "./page-renderer";

type RecordValue = Record<string, unknown>;

/**
 * Editeur de page Vue fonctionnel reutilisant le core: librairie de blocs,
 * canvas (selection, reordonnancement, suppression), inspecteur pilote par
 * schema et preview via le renderer HTML headless. v-model sur `document`.
 */
export const PageBuilder = defineComponent({
  name: "PageBuilder",
  props: {
    document: { type: Object as PropType<PageDocument>, required: true },
    registry: { type: Object as PropType<BlockRegistry>, required: true },
  },
  emits: ["update:document", "save"],
  setup(props, { emit }) {
    const docRef = computed(() => props.document);
    const builder = usePageBuilder(docRef, (next) => emit("update:document", next));

    function renderLibrary() {
      const grouped = props.registry.byCategory();
      const groups = Object.entries(grouped).map(([category, definitions]) =>
        h("div", { class: "mpb-library-group" }, [
          h("h4", category),
          ...definitions.map((definition) =>
            h(
              "button",
              {
                type: "button",
                class: "mpb-add-block",
                "data-type": definition.type,
                onClick: () => builder.add(definition),
              },
              definition.label,
            ),
          ),
        ]),
      );
      return h("aside", { class: "mpb-library" }, [h("h3", "Ajouter un bloc"), ...groups]);
    }

    function renderCanvas() {
      const blocks = props.document.blocks;
      if (!blocks.length) {
        return h("div", { class: "mpb-canvas mpb-canvas-empty" }, "Aucun bloc. Ajoute un bloc depuis la librairie.");
      }

      const items = blocks.map((block, index) => {
        const definition = props.registry.get(block.type);
        return h(
          "div",
          {
            class: ["mpb-canvas-item", { "is-selected": builder.selectedId.value === block.id }],
            "data-block-id": block.id,
            onClick: () => builder.select(block.id),
          },
          [
            h("span", { class: "mpb-canvas-item-label" }, definition?.label ?? block.type),
            h("div", { class: "mpb-canvas-item-actions" }, [
              h(
                "button",
                { type: "button", disabled: index === 0, onClick: withStop(() => builder.move(block.id, index - 1)) },
                "↑",
              ),
              h(
                "button",
                {
                  type: "button",
                  disabled: index === blocks.length - 1,
                  onClick: withStop(() => builder.move(block.id, index + 1)),
                },
                "↓",
              ),
              h("button", { type: "button", onClick: withStop(() => builder.remove(block.id)) }, "✕"),
            ]),
          ],
        );
      });

      return h("div", { class: "mpb-canvas" }, items);
    }

    return () =>
      h("div", { class: "mpb-page-builder" }, [
        renderLibrary(),
        h("main", { class: "mpb-main" }, [
          renderCanvas(),
          h("div", { class: "mpb-preview" }, [
            h("h3", "Apercu"),
            h(PageRenderer, { document: props.document, registry: props.registry }),
          ]),
          h(
            "button",
            { type: "button", class: "mpb-save", onClick: () => emit("save", props.document) },
            "Enregistrer",
          ),
        ]),
        h(BlockInspector, {
          block: builder.selectedBlock.value,
          registry: props.registry,
          "onUpdate-content": (id: string, content: RecordValue) => builder.updateContent(id, content),
          "onUpdate-settings": (id: string, settings: RecordValue) => builder.updateSettings(id, settings),
          onDuplicate: (id: string) => builder.duplicate(id),
          onDelete: (id: string) => builder.remove(id),
          "onToggle-visibility": (id: string) => builder.toggleVisibility(id),
        }),
      ]);
  },
});

function withStop(handler: () => void) {
  return (event: Event) => {
    event.stopPropagation();
    handler();
  };
}
