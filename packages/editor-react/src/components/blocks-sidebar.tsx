import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  LayoutPanelLeft,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  AssetPickerAdapter,
  BlockDefinition,
  BlockRegistry,
  PageBlock,
  PageDocument,
} from "@n-ramos/celebrimbor-core";
import { SchemaForm } from "../forms/schema-form";
import type { CustomFieldRegistry } from "../types";

type BlocksSidebarProps = {
  document: PageDocument;
  registry: BlockRegistry;
  selectedBlockId?: string | undefined;
  assetPicker?: AssetPickerAdapter | undefined;
  customFields?: CustomFieldRegistry | undefined;
  canSave?: boolean;
  saving?: boolean;
  onSave?: () => Promise<void>;
  onSelect: (blockId?: string) => void;
  onAdd: (definition: BlockDefinition) => void;
  onUpdateContent: (blockId: string, content: Record<string, unknown>) => void;
  onUpdateSettings: (blockId: string, settings: Record<string, unknown>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
};

export function BlocksSidebar({
  document,
  registry,
  selectedBlockId,
  assetPicker,
  customFields,
  canSave,
  saving,
  onSave,
  onSelect,
  onAdd,
  onUpdateContent,
  onUpdateSettings,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: BlocksSidebarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { isOver, setNodeRef } = useDroppable({ id: "blocks-root" });

  return (
    <>
      <aside className="flex min-h-full flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              <LayoutPanelLeft className="h-4 w-4" />
              Blocs
            </button>
            <button
              type="button"
              className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
            >
              <Code2 className="h-4 w-4" />
              JSON
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.75)] transition hover:bg-blue-700"
              onClick={() => setIsPickerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Ajouter un bloc
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Sparkles className="h-4 w-4" />
            Agnostic Builder
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Compose ta page</h2>
          <p className="mt-2 text-sm text-slate-500">
            Reordonne tes blocs et ouvre chaque carte pour modifier le contenu directement dans la sidebar.
          </p>
          <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {document.blocks.length} bloc(s)
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/80 px-4 py-4">
          <div
            ref={setNodeRef}
            className={`rounded-[1.6rem] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3 transition ${
              isOver ? "ring-2 ring-inset ring-cyan-300" : ""
            }`}
          >
            <SortableContext items={document.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {document.blocks.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-cyan-300 bg-white px-5 py-10 text-center">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Bloc list</div>
                    <p className="mt-3 text-sm text-slate-500">
                      Ouvre la modale pour choisir ton premier bloc. Il arrivera ici avec sa configuration editable.
                    </p>
                  </div>
                ) : null}

                {document.blocks.map((block, index) => (
                  <SidebarBlockCard
                    key={block.id}
                    block={block}
                    index={index}
                    registry={registry}
                    selected={selectedBlockId === block.id}
                    assetPicker={assetPicker}
                    customFields={customFields}
                    onSelect={onSelect}
                    onUpdateContent={onUpdateContent}
                    onUpdateSettings={onUpdateSettings}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onToggleVisibility={onToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">Portable JSON ready</div>
            <button
              type="button"
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.75)] transition disabled:opacity-50"
              onClick={() => void onSave?.()}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </aside>

      <BlockPickerModal
        open={isPickerOpen}
        registry={registry}
        onClose={() => setIsPickerOpen(false)}
        onPick={(definition) => {
          onAdd(definition);
          setIsPickerOpen(false);
        }}
      />
    </>
  );
}

type SidebarBlockCardProps = {
  block: PageBlock;
  index: number;
  registry: BlockRegistry;
  selected: boolean;
  assetPicker?: AssetPickerAdapter | undefined;
  customFields?: CustomFieldRegistry | undefined;
  onSelect: (blockId?: string) => void;
  onUpdateContent: (blockId: string, content: Record<string, unknown>) => void;
  onUpdateSettings: (blockId: string, settings: Record<string, unknown>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
};

function SidebarBlockCard({
  block,
  index,
  registry,
  selected,
  assetPicker,
  customFields,
  onSelect,
  onUpdateContent,
  onUpdateSettings,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: SidebarBlockCardProps) {
  const definition = registry.get(block.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <article
      ref={setNodeRef}
      className={`overflow-hidden rounded-[1.5rem] border transition ${
        selected
          ? "border-cyan-300 bg-white shadow-[0_22px_45px_-34px_rgba(6,182,212,0.55)]"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      style={{
        opacity: isDragging ? 0.58 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="flex-1 text-left"
            onClick={() => onSelect(selected ? undefined : block.id)}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Bloc {index + 1}</span>
              <span
                className={`rounded-full px-2.5 py-1 ${
                  block.visible ?? true ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {block.visible ?? true ? "Visible" : "Masque"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                {iconForBlock(definition?.type ?? block.type)}
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-950">
                  {definition?.label ?? `Unknown: ${block.type}`}
                </div>
                <div className="mt-1 text-sm text-slate-500">{definition?.type ?? block.type}</div>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex cursor-grab items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 active:cursor-grabbing"
              aria-label={`Reordonner ${definition?.label ?? block.type}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
              Drag
            </button>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
              {selected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="space-y-5 bg-white px-4 py-4">
          {definition ? (
            <>
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contenu</h3>
                <SchemaForm
                  schema={definition.schema}
                  value={(block.content as Record<string, unknown>) ?? {}}
                  onChange={(content) => onUpdateContent(block.id, content)}
                  assetPicker={assetPicker}
                  customFields={customFields}
                />
              </section>

              {definition.settingsSchema ? (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Settings
                  </h3>
                  <SchemaForm
                    schema={definition.settingsSchema}
                    value={(block.settings as Record<string, unknown>) ?? {}}
                    onChange={(settings) => onUpdateSettings(block.id, settings)}
                    assetPicker={assetPicker}
                    customFields={customFields}
                  />
                </section>
              ) : null}
            </>
          ) : (
            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Le type <code>{block.type}</code> n&apos;est pas enregistre, mais son JSON reste conserve.
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              onClick={() => onToggleVisibility(block.id)}
            >
              {block.visible ?? true ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {block.visible ?? true ? "Masquer" : "Afficher"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              onClick={() => onDuplicate(block.id)}
            >
              <Copy className="h-4 w-4" />
              Dupliquer
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
              onClick={() => onDelete(block.id)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

type BlockPickerModalProps = {
  open: boolean;
  registry: BlockRegistry;
  onClose: () => void;
  onPick: (definition: BlockDefinition) => void;
};

function BlockPickerModal({ open, registry, onClose, onPick }: BlockPickerModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filteredGroups = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return Object.entries(registry.byCategory())
      .map(([category, definitions]) => [
        category,
        definitions.filter((definition) =>
          [definition.label, definition.type, ...(definition.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(lowerQuery),
        ),
      ] as const)
      .filter(([, definitions]) => definitions.length > 0);
  }, [query, registry]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_36px_120px_-50px_rgba(15,23,42,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#ecfeff_100%)] px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ajouter un bloc</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Choisis une brique a inserer</h3>
            <p className="mt-2 text-sm text-slate-500">
              Le bloc sera ajoute dans la sidebar, pret a etre configure, puis rendu dans la preview centrale.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
              placeholder="Recherche par nom, type ou tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="max-h-[65vh] space-y-6 overflow-auto pr-1">
            {filteredGroups.map(([category, definitions]) => (
              <section key={category}>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{category}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {definitions.map((definition) => (
                    <button
                      key={definition.type}
                      type="button"
                      className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_40px_-24px_rgba(8,145,178,0.35)]"
                      onClick={() => onPick(definition)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                            {iconForBlock(definition.type)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{definition.label}</div>
                            <div className="mt-1 text-sm text-slate-500">{definition.type}</div>
                          </div>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter
                          </span>
                        </div>
                      </div>
                      {definition.tags?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {definition.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {filteredGroups.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                Aucun bloc ne correspond a cette recherche.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function iconForBlock(type: string) {
  if (type.includes("image") || type.includes("gallery")) {
    return <Sparkles className="h-5 w-5" />;
  }

  if (type.includes("rich") || type.includes("text") || type.includes("faq")) {
    return <LayoutPanelLeft className="h-5 w-5" />;
  }

  return <LayoutPanelLeft className="h-5 w-5" />;
}
