import { defineComponent, h, type PropType } from "vue";
import {
  validateSchemaValue,
  type BlockRegistry,
  type PageBlock,
} from "@n-ramos/celebrimbor-core";
import { SchemaForm } from "./schema-form";

type RecordValue = Record<string, unknown>;

/**
 * Inspecteur du bloc selectionne : edition du contenu et des reglages via
 * `SchemaForm`, avec validation live (issues recalculees a chaque rendu), plus
 * les actions dupliquer / supprimer / visibilite.
 */
export const BlockInspector = defineComponent({
  name: "BlockInspector",
  props: {
    block: { type: Object as PropType<PageBlock | undefined>, default: undefined },
    registry: { type: Object as PropType<BlockRegistry>, required: true },
  },
  emits: ["update-content", "update-settings", "duplicate", "delete", "toggle-visibility"],
  setup(props, { emit }) {
    return () => {
      const block = props.block;
      if (!block) {
        return h("aside", { class: "mpb-inspector mpb-inspector-empty" }, "Selectionne un bloc");
      }

      const definition = props.registry.get(block.type);
      if (!definition) {
        return h("aside", { class: "mpb-inspector mpb-inspector-unknown" }, [
          h("h2", `Bloc inconnu: ${block.type}`),
          h("p", "Les donnees JSON sont conservees."),
        ]);
      }

      const content = (block.content as RecordValue) ?? {};
      const settings = (block.settings as RecordValue) ?? {};

      const sections = [
        h("h2", { class: "mpb-inspector-title" }, definition.label),
        h("section", { class: "mpb-inspector-content" }, [
          h("h3", "Contenu"),
          h(SchemaForm, {
            fields: definition.schema.fields,
            value: content,
            issues: validateSchemaValue(definition.schema, content).issues,
            "onUpdate:value": (next: RecordValue) => emit("update-content", block.id, next),
          }),
        ]),
      ];

      if (definition.settingsSchema) {
        sections.push(
          h("section", { class: "mpb-inspector-settings" }, [
            h("h3", "Reglages"),
            h(SchemaForm, {
              fields: definition.settingsSchema.fields,
              value: settings,
              issues: validateSchemaValue(definition.settingsSchema, settings).issues,
              "onUpdate:value": (next: RecordValue) => emit("update-settings", block.id, next),
            }),
          ]),
        );
      }

      sections.push(
        h("div", { class: "mpb-inspector-actions" }, [
          h("button", { type: "button", onClick: () => emit("toggle-visibility", block.id) }, (block.visible ?? true) ? "Masquer" : "Afficher"),
          h("button", { type: "button", onClick: () => emit("duplicate", block.id) }, "Dupliquer"),
          h("button", { type: "button", onClick: () => emit("delete", block.id) }, "Supprimer"),
        ]),
      );

      return h("aside", { class: "mpb-inspector" }, sections);
    };
  },
});
