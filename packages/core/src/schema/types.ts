export type PrimitiveFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "markdown"
  | "number"
  | "range"
  | "boolean"
  | "select"
  | "radio"
  | "color"
  | "url"
  | "date"
  | "alignment"
  | "textalign"
  | "asset";

export type BlockFieldType =
  | PrimitiveFieldType
  | "object"
  | "array"
  | "custom"
  | "row"
  | "tabs";

export type SelectOption<TValue = string> = {
  label: string;
  value: TValue;
};

/** Options par defaut du champ `alignment` (alignement de bloc). */
export const ALIGNMENT_OPTIONS: SelectOption[] = [
  { label: "Gauche", value: "left" },
  { label: "Centre", value: "center" },
  { label: "Droite", value: "right" },
];

/** Options par defaut du champ `textalign` (alignement de texte). */
export const TEXT_ALIGN_OPTIONS: SelectOption[] = [
  { label: "Gauche", value: "left" },
  { label: "Centre", value: "center" },
  { label: "Droite", value: "right" },
  { label: "Justifie", value: "justify" },
];

/**
 * Renvoie le jeu d'options implicite d'un champ enumere. Les champs
 * `alignment`/`textalign` ont des valeurs fixes par defaut, surchargeables via
 * `field.options`.
 */
export function defaultFieldOptions(type: PrimitiveFieldType): SelectOption[] | undefined {
  if (type === "alignment") {
    return ALIGNMENT_OPTIONS;
  }
  if (type === "textalign") {
    return TEXT_ALIGN_OPTIONS;
  }
  return undefined;
}

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
  /** Borne basse du champ `range`/`number`. */
  min?: number | undefined;
  /** Borne haute du champ `range`/`number`. */
  max?: number | undefined;
  /** Pas du curseur `range`. */
  step?: number | undefined;
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

/**
 * Champ d'extension. Le rendu est delegue a un composant enregistre cote
 * editeur sous la cle `component` (registre `customFields`). `options` est
 * transmis tel quel au composant. La valeur stockee reste serialisable JSON.
 */
export type CustomField<TValue = unknown> = BaseField<TValue> & {
  type: "custom";
  component: string;
  options?: Record<string, unknown> | undefined;
};

/**
 * Conteneur de presentation: dispose ses `fields` enfants sur une meme ligne
 * (colonnes). N'introduit **pas** de cle de donnees — les enfants ecrivent a
 * plat dans la valeur parente (contrairement a `object`). `columns` suit la
 * syntaxe CSS `grid-template-columns` (ex. `"30% 70%"`).
 */
export type RowField = {
  type: "row";
  label?: string | undefined;
  columns?: string | undefined;
  fields: BlockField[];
};

export type TabsTab = {
  label: string;
  fields: BlockField[];
};

/**
 * Conteneur de presentation: groupe ses champs en onglets. Comme `row`, les
 * champs des onglets ecrivent a plat dans la valeur parente.
 */
export type TabsField = {
  type: "tabs";
  label?: string | undefined;
  tabs: TabsTab[];
};

/** Conteneurs de presentation, sans cle de donnees propre. */
export type LayoutField = RowField | TabsField;

/** Champs porteurs d'une valeur (avec un `name`). */
export type DataField = PrimitiveField | ObjectField | ArrayField | CustomField;

export type BlockField = DataField | LayoutField;

/** Vrai pour les conteneurs de presentation (`row`/`tabs`), qui n'ont pas de `name`. */
export function isLayoutField(field: BlockField): field is LayoutField {
  return field.type === "row" || field.type === "tabs";
}

/**
 * Aplati une liste de `fields` en ne gardant que les champs porteurs de
 * donnees: les conteneurs `row`/`tabs` sont remplaces par leurs enfants
 * (recursivement), tandis que `object`/`array` restent intacts (ils gerent
 * leur propre imbrication).
 */
export function flattenDataFields(fields: BlockField[]): DataField[] {
  const result: DataField[] = [];
  for (const field of fields) {
    if (field.type === "row") {
      result.push(...flattenDataFields(field.fields));
    } else if (field.type === "tabs") {
      for (const tab of field.tabs) {
        result.push(...flattenDataFields(tab.fields));
      }
    } else {
      result.push(field);
    }
  }
  return result;
}

export type BlockSchema<TValue = unknown> = {
  fields: BlockField[];
  zodSchema?: unknown;
  parse?: ((value: unknown) => TValue) | undefined;
};
