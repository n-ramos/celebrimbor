import type {
  AssetPickerAdapter,
  BlockRegistry,
  PageBuilderStorage,
  PageDocument,
} from "@n-ramos/core";

export type PageBuilderProps = {
  document: PageDocument;
  registry: BlockRegistry;
  storage?: PageBuilderStorage | undefined;
  assetPicker?: AssetPickerAdapter | undefined;
  selectedBlockId?: string | undefined;
  onChange: (document: PageDocument) => void;
  onSave?: ((document: PageDocument) => Promise<void>) | undefined;
  onSelectBlock?: ((blockId?: string) => void) | undefined;
};

export type SchemaFormProps<TValue = Record<string, unknown>> = {
  schema: {
    fields: import("@n-ramos/core").BlockField[];
  };
  value: TValue;
  onChange: (value: TValue) => void;
  assetPicker?: AssetPickerAdapter | undefined;
  /**
   * Anomalies de validation a afficher sous les champs concernes. Les `path`
   * sont relatifs a `value` (ex. `title`, `items.0.question`). Permet une
   * validation a la frappe quand le parent recalcule a chaque `onChange`.
   */
  issues?: import("@n-ramos/core").ValidationIssue[] | undefined;
};
