import { defineComponent, h, ref, type Component, type PropType, type VNode } from "vue";
import {
  defaultFieldOptions,
  flattenDataFields,
  type ArrayField,
  type BlockField,
  type CustomField,
  type ObjectField,
  type PrimitiveField,
  type RowField,
  type TabsField,
  type ValidationIssue,
} from "@n-ramos/celebrimbor-core";

type RecordValue = Record<string, unknown>;

/** Registre des champs `custom`, indexe par la cle `component` du field. */
export type CustomFieldRegistry = Record<string, Component>;

/** Onglets, composant a etat local pour conserver l'onglet actif entre rendus. */
const TabsLayout = defineComponent({
  name: "TabsLayout",
  props: {
    field: { type: Object as PropType<TabsField>, required: true },
    renderField: { type: Function as PropType<(field: BlockField) => VNode>, required: true },
  },
  setup(props) {
    const active = ref(0);
    return () => {
      const tabs = props.field.tabs;
      const index = active.value < tabs.length ? active.value : 0;
      const current = tabs[index];
      return h("div", { class: "mpb-tabs" }, [
        h(
          "div",
          { class: "mpb-tablist", role: "tablist" },
          tabs.map((tab, tabIndex) =>
            h(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": tabIndex === index,
                class: ["mpb-tab", { "is-active": tabIndex === index }],
                onClick: () => {
                  active.value = tabIndex;
                },
              },
              tab.label,
            ),
          ),
        ),
        h("div", { class: "mpb-tabpanel" }, (current?.fields ?? []).map((field) => props.renderField(field))),
      ]);
    };
  },
});

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
}

function directError(issues: ValidationIssue[] | undefined, name: string): string | undefined {
  return issues?.find((issue) => issue.path === name)?.message;
}

function scopeIssues(issues: ValidationIssue[] | undefined, prefix: string): ValidationIssue[] | undefined {
  if (!issues?.length) {
    return undefined;
  }
  const scoped = issues
    .filter((issue) => issue.path.startsWith(`${prefix}.`))
    .map((issue) => ({ ...issue, path: issue.path.slice(prefix.length + 1) }));
  return scoped.length ? scoped : undefined;
}

function defaultForField(field: PrimitiveField | ObjectField | CustomField): unknown {
  if (field.defaultValue !== undefined) {
    return structuredClone(field.defaultValue);
  }
  if (field.type === "custom") return undefined;
  if (field.type === "object") {
    // Les enfants `row`/`tabs` sont aplatis: leurs cles vivent au meme niveau.
    return flattenDataFields(field.fields).reduce<RecordValue>((accumulator, child) => {
      if (child.type === "array") {
        accumulator[child.name] =
          child.defaultValue !== undefined ? structuredClone(child.defaultValue) : [];
      } else {
        accumulator[child.name] = defaultForField(child as PrimitiveField | ObjectField | CustomField);
      }
      return accumulator;
    }, {});
  }
  if (field.type === "number") return 0;
  if (field.type === "range") return field.min ?? 0;
  if (field.type === "boolean") return false;
  if (field.type === "asset") return null;
  if (field.type === "alignment" || field.type === "textalign") {
    const options = field.options ?? defaultFieldOptions(field.type) ?? [];
    return options[0]?.value ?? "";
  }
  return "";
}

/**
 * Formulaire pilote par schema, port Vue de `SchemaForm`. Couvre les champs
 * primitifs (text/textarea/url/color/number/range/boolean/select/radio/date/
 * alignment/textalign), les objets imbriques, les tableaux (`array`), les
 * conteneurs de presentation (`row`/`tabs`, dont les enfants ecrivent a plat)
 * et les champs `custom` (via le registre `customFields`). Affiche les
 * anomalies de `issues` sous les champs concernes pour une validation a la frappe.
 */
export const SchemaForm = defineComponent({
  name: "SchemaForm",
  props: {
    fields: { type: Array as PropType<BlockField[]>, required: true },
    value: { type: Object as PropType<RecordValue>, required: true },
    issues: { type: Array as PropType<ValidationIssue[] | undefined>, default: undefined },
    customFields: { type: Object as PropType<CustomFieldRegistry | undefined>, default: undefined },
  },
  emits: ["update:value"],
  setup(props, { emit }) {
    function patch(name: string, next: unknown) {
      emit("update:value", { ...props.value, [name]: next });
    }

    function renderError(message: string | undefined): VNode | null {
      return message ? h("p", { role: "alert", class: "mpb-field-error" }, message) : null;
    }

    function renderPrimitive(field: PrimitiveField, value: unknown, onInput: (next: unknown) => void): VNode {
      if (field.type === "boolean") {
        return h("input", {
          type: "checkbox",
          checked: Boolean(value),
          onChange: (event: Event) => onInput((event.target as HTMLInputElement).checked),
        });
      }
      if (field.type === "textarea" || field.type === "richtext" || field.type === "markdown") {
        return h("textarea", {
          value: String(value ?? ""),
          onInput: (event: Event) => onInput((event.target as HTMLTextAreaElement).value),
        });
      }
      const enumOptions =
        field.type === "select" || field.type === "radio"
          ? field.options
          : field.options ?? defaultFieldOptions(field.type);
      if (
        (field.type === "select" ||
          field.type === "radio" ||
          field.type === "alignment" ||
          field.type === "textalign") &&
        enumOptions?.length
      ) {
        return h(
          "select",
          {
            value: String(value ?? ""),
            onChange: (event: Event) => onInput((event.target as HTMLSelectElement).value),
          },
          enumOptions.map((option) =>
            h("option", { value: String(option.value) }, option.label),
          ),
        );
      }
      const isNumeric = field.type === "number" || field.type === "range";
      return h("input", {
        type:
          field.type === "number"
            ? "number"
            : field.type === "range"
              ? "range"
              : field.type === "url"
                ? "url"
                : field.type === "date"
                  ? "date"
                  : field.type === "color"
                    ? "color"
                    : "text",
        ...(field.type === "range"
          ? { min: field.min ?? 0, max: field.max ?? 100, step: field.step ?? 1 }
          : {}),
        value: value == null ? "" : String(value),
        onInput: (event: Event) => {
          const raw = (event.target as HTMLInputElement).value;
          onInput(isNumeric ? (raw === "" ? undefined : Number(raw)) : raw);
        },
      });
    }

    function renderRow(field: RowField): VNode {
      const columns = field.columns ?? `repeat(${Math.max(field.fields.length, 1)}, minmax(0, 1fr))`;
      const children = field.fields.map((child) => renderField(child));
      const grid = h(
        "div",
        { class: "mpb-row", style: { display: "grid", gridTemplateColumns: columns, gap: "0.75rem" } },
        children,
      );
      return field.label
        ? h("div", { class: "mpb-row-group" }, [h("div", { class: "mpb-row-label" }, field.label), grid])
        : grid;
    }

    function renderCustom(field: CustomField, value: unknown, onInput: (next: unknown) => void): VNode {
      const component = props.customFields?.[field.component];
      if (!component) {
        return h(
          "p",
          { class: "mpb-field-note" },
          `Champ custom "${field.component}" non enregistre (fournis-le via customFields).`,
        );
      }
      return h(component, { field, value, onChange: onInput });
    }

    function renderField(field: BlockField): VNode {
      // Conteneurs de presentation: pas de cle de donnees, enfants a plat.
      if (field.type === "row") {
        return renderRow(field);
      }
      if (field.type === "tabs") {
        return h(TabsLayout, { field, renderField });
      }

      const error = directError(props.issues, field.name);
      const fieldValue = props.value[field.name];

      let control: VNode;
      if (field.type === "object") {
        control = h(SchemaForm, {
          fields: field.fields,
          value: asRecord(fieldValue),
          issues: scopeIssues(props.issues, field.name),
          customFields: props.customFields,
          "onUpdate:value": (next: RecordValue) => patch(field.name, next),
        });
      } else if (field.type === "array") {
        control = renderArray(field, Array.isArray(fieldValue) ? fieldValue : []);
      } else if (field.type === "custom") {
        control = renderCustom(field, fieldValue, (next) => patch(field.name, next));
      } else {
        control = renderPrimitive(field, fieldValue, (next) => patch(field.name, next));
      }

      return h("div", { class: "mpb-field", "data-field": field.name }, [
        h("label", { class: "mpb-field-label" }, [field.label, field.required ? " *" : ""]),
        control,
        renderError(error),
      ]);
    }

    function renderArray(field: ArrayField, items: unknown[]): VNode {
      const scoped = scopeIssues(props.issues, field.name);
      const canAdd = field.maxItems === undefined || items.length < field.maxItems;
      const minItems = field.minItems ?? 0;

      const rows = items.map((entry, index) => {
        const itemIssues = scopeIssues(scoped, String(index));
        const body =
          field.of.type === "object"
            ? h(SchemaForm, {
                fields: field.of.fields,
                value: asRecord(entry),
                issues: itemIssues,
                customFields: props.customFields,
                "onUpdate:value": (next: RecordValue) =>
                  patch(field.name, items.map((item, i) => (i === index ? next : item))),
              })
            : renderPrimitive(field.of, entry, (next) =>
                patch(field.name, items.map((item, i) => (i === index ? next : item))),
              );

        return h("div", { class: "mpb-array-item", "data-index": index }, [
          body,
          h(
            "button",
            {
              type: "button",
              disabled: items.length <= minItems,
              onClick: () => patch(field.name, items.filter((_, i) => i !== index)),
            },
            "Retirer",
          ),
        ]);
      });

      return h("div", { class: "mpb-array" }, [
        ...rows,
        h(
          "button",
          {
            type: "button",
            disabled: !canAdd,
            onClick: () => patch(field.name, [...items, defaultForField(field.of)]),
          },
          "Ajouter un item",
        ),
      ]);
    }

    return () => h("div", { class: "mpb-schema-form" }, props.fields.map(renderField));
  },
});
