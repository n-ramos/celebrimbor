export type PrimitiveFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "markdown"
  | "number"
  | "boolean"
  | "select"
  | "radio"
  | "color"
  | "url"
  | "asset";

export type BlockFieldType = PrimitiveFieldType | "object" | "array";

export type SelectOption<TValue = string> = {
  label: string;
  value: TValue;
};

export type BaseField<TValue = unknown> = {
  name: string;
  type: BlockFieldType;
  label: string;
  description?: string | undefined;
  required?: boolean | undefined;
  defaultValue?: TValue | undefined;
};

export type PrimitiveField<TValue = unknown> = BaseField<TValue> & {
  type: PrimitiveFieldType;
  options?: SelectOption[] | undefined;
};

export type ObjectField = BaseField<Record<string, unknown>> & {
  type: "object";
  fields: BlockField[];
};

export type ArrayField = BaseField<unknown[]> & {
  type: "array";
  itemLabel?: string | undefined;
  of: PrimitiveField | ObjectField;
  minItems?: number | undefined;
  maxItems?: number | undefined;
};

export type BlockField = PrimitiveField | ObjectField | ArrayField;

export type BlockSchema<TValue = unknown> = {
  fields: BlockField[];
  zodSchema?: unknown;
  parse?: ((value: unknown) => TValue) | undefined;
};
