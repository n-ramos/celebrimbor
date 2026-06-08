import { defineComponent, h, type PropType, type VNode } from "vue";
import type {
  ArrayField,
  BlockField,
  ObjectField,
  PrimitiveField,
  ValidationIssue,
} from "@n-ramos/core";

type RecordValue = Record<string, unknown>;

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

function defaultForField(field: PrimitiveField | ObjectField): unknown {
  if (field.defaultValue !== undefined) {
    return structuredClone(field.defaultValue);
  }
  if (field.type === "object") {
    return field.fields.reduce<RecordValue>((accumulator, child) => {
      accumulator[child.name] = child.type === "array" ? [] : defaultForField(child as PrimitiveField | ObjectField);
      return accumulator;
    }, {});
  }
  if (field.type === "number") return 0;
  if (field.type === "boolean") return false;
  if (field.type === "asset") return null;
  return "";
}

/**
 * Formulaire pilote par schema, port Vue de `SchemaForm`. Couvre les champs
 * primitifs (text/textarea/url/color/number/boolean/select/radio), les objets
 * imbriques et les tableaux (`array`). Affiche les anomalies de `issues` sous
 * les champs concernes pour une validation a la frappe.
 */
export const SchemaForm = defineComponent({
  name: "SchemaForm",
  props: {
    fields: { type: Array as PropType<BlockField[]>, required: true },
    value: { type: Object as PropType<RecordValue>, required: true },
    issues: { type: Array as PropType<ValidationIssue[] | undefined>, default: undefined },
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
      if ((field.type === "select" || field.type === "radio") && field.options?.length) {
        return h(
          "select",
          {
            value: String(value ?? ""),
            onChange: (event: Event) => onInput((event.target as HTMLSelectElement).value),
          },
          field.options.map((option) =>
            h("option", { value: String(option.value) }, option.label),
          ),
        );
      }
      return h("input", {
        type: field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "color" ? "color" : "text",
        value: value == null ? "" : String(value),
        onInput: (event: Event) => {
          const raw = (event.target as HTMLInputElement).value;
          onInput(field.type === "number" ? (raw === "" ? undefined : Number(raw)) : raw);
        },
      });
    }

    function renderField(field: BlockField): VNode {
      const error = directError(props.issues, field.name);
      const fieldValue = props.value[field.name];

      let control: VNode;
      if (field.type === "object") {
        control = h(SchemaForm, {
          fields: field.fields,
          value: asRecord(fieldValue),
          issues: scopeIssues(props.issues, field.name),
          "onUpdate:value": (next: RecordValue) => patch(field.name, next),
        });
      } else if (field.type === "array") {
        control = renderArray(field, Array.isArray(fieldValue) ? fieldValue : []);
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
