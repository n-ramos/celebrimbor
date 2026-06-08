import type { AssetPickerAdapter, BlockRegistry, PageBlock } from "@n-ramos/core";
import { validateSchemaValue } from "@n-ramos/core";
import { SchemaForm } from "../forms/schema-form";

type BlockInspectorProps = {
  block?: PageBlock | undefined;
  registry: BlockRegistry;
  assetPicker?: AssetPickerAdapter | undefined;
  onUpdateContent: (blockId: string, content: Record<string, unknown>) => void;
  onUpdateSettings: (blockId: string, settings: Record<string, unknown>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
};

export function BlockInspector({
  block,
  registry,
  assetPicker,
  onUpdateContent,
  onUpdateSettings,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: BlockInspectorProps) {
  if (!block) {
    return (
      <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Selectionne un bloc</h2>
        <p className="mt-3 text-sm text-slate-500">Clique un bloc du canvas pour modifier son contenu et ses settings.</p>
      </aside>
    );
  }

  const definition = registry.get(block.type);
  if (!definition) {
    return (
      <aside className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-900">Unknown block</h2>
        <p className="mt-2 text-sm text-amber-800">
          The block type <code>{block.type}</code> is not registered, but its JSON data is preserved.
        </p>
      </aside>
    );
  }

  const contentValue = (block.content as Record<string, unknown>) ?? {};
  const settingsValue = (block.settings as Record<string, unknown>) ?? {};

  return (
    <aside className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{definition.label}</h2>
          <p className="mt-1 text-sm text-slate-500">{definition.type}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={() => onToggleVisibility(block.id)}
        >
          {block.visible ?? true ? "Hide" : "Show"}
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Content</h3>
        <SchemaForm
          schema={definition.schema}
          value={contentValue}
          onChange={(content) => onUpdateContent(block.id, content)}
          assetPicker={assetPicker}
          issues={validateSchemaValue(definition.schema, contentValue).issues}
        />
      </div>

      {definition.settingsSchema ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Settings</h3>
          <SchemaForm
            schema={definition.settingsSchema}
            value={settingsValue}
            onChange={(settings) => onUpdateSettings(block.id, settings)}
            assetPicker={assetPicker}
            issues={validateSchemaValue(definition.settingsSchema, settingsValue).issues}
          />
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={() => onDuplicate(block.id)}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
          onClick={() => onDelete(block.id)}
        >
          Delete
        </button>
      </div>
    </aside>
  );
}
