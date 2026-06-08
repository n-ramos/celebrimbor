import type { ReactNode } from "react";
import type {
  AssetPickerAdapter,
  BlockRegistry,
  CustomField,
  PageBuilderStorage,
  PageDocument,
} from "@n-ramos/celebrimbor-core";

/** Props recues par un composant de champ `custom`. */
export type CustomFieldComponentProps = {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
};

/** Composant rendant un champ `custom`. */
export type CustomFieldComponent = (props: CustomFieldComponentProps) => ReactNode;

/** Registre des champs `custom`, indexe par la cle `component` du field. */
export type CustomFieldRegistry = Record<string, CustomFieldComponent>;

export type PageBuilderProps = {
  document: PageDocument;
  registry: BlockRegistry;
  storage?: PageBuilderStorage | undefined;
  assetPicker?: AssetPickerAdapter | undefined;
  /** Composants pour les champs `custom`, indexes par leur cle `component`. */
  customFields?: CustomFieldRegistry | undefined;
  selectedBlockId?: string | undefined;
  /**
   * When set, the preview pane embeds this URL in an iframe (server-rendered
   * preview) and posts the live document to it via postMessage, instead of the
   * built-in client renderer.
   */
  previewUrl?: string | undefined;
  onChange: (document: PageDocument) => void;
  onSave?: ((document: PageDocument) => Promise<void>) | undefined;
  onSelectBlock?: ((blockId?: string) => void) | undefined;
};

export type SchemaFormProps<TValue = Record<string, unknown>> = {
  schema: {
    fields: import("@n-ramos/celebrimbor-core").BlockField[];
  };
  value: TValue;
  onChange: (value: TValue) => void;
  assetPicker?: AssetPickerAdapter | undefined;
  /** Composants pour les champs `custom`, indexes par leur cle `component`. */
  customFields?: CustomFieldRegistry | undefined;
  /**
   * Anomalies de validation a afficher sous les champs concernes. Les `path`
   * sont relatifs a `value` (ex. `title`, `items.0.question`). Permet une
   * validation a la frappe quand le parent recalcule a chaque `onChange`.
   */
  issues?: import("@n-ramos/celebrimbor-core").ValidationIssue[] | undefined;
};
