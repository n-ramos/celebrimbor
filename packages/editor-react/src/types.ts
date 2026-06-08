import type {
  AssetPickerAdapter,
  BlockRegistry,
  PageBuilderStorage,
  PageDocument,
} from "@n-ramos/celebrimbor-core";

export type PageBuilderProps = {
  document: PageDocument;
  registry: BlockRegistry;
  storage?: PageBuilderStorage | undefined;
  assetPicker?: AssetPickerAdapter | undefined;
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
  /**
   * Anomalies de validation a afficher sous les champs concernes. Les `path`
   * sont relatifs a `value` (ex. `title`, `items.0.question`). Permet une
   * validation a la frappe quand le parent recalcule a chaque `onChange`.
   */
  issues?: import("@n-ramos/celebrimbor-core").ValidationIssue[] | undefined;
};
