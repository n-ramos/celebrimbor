import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BlockRegistry, PageDocument } from "@n-ramos/core";
import { BlockItem } from "../components/block-item";

type BlockCanvasProps = {
  document: PageDocument;
  registry: BlockRegistry;
  selectedBlockId?: string | undefined;
  onSelect: (blockId: string) => void;
};

export function BlockCanvas({
  document,
  registry,
  selectedBlockId,
  onSelect,
}: BlockCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({ id: "canvas-root" });

  return (
    <section className="overflow-hidden rounded-[1.85rem] border border-slate-200 bg-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Canvas</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Structure de page</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {document.blocks.length} block(s)
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-500">
          Ordonne les blocs au centre, glisse-en de nouveaux depuis la colonne de gauche, puis affine leur
          contenu plus bas dans l&apos;inspecteur.
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[420px] bg-[radial-gradient(circle_at_top,#f0fdfa_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-6 py-6 transition ${
          isOver ? "ring-2 ring-inset ring-cyan-300" : ""
        }`}
      >
        <SortableContext items={document.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {document.blocks.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-cyan-300 bg-white/90 px-6 py-12 text-center">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Drop zone</div>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
                  Depose un bloc ici pour commencer une page portable et agnostique, framework par framework.
                </p>
              </div>
            ) : null}
            {document.blocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                label={registry.get(block.type)?.label ?? `Unknown: ${block.type}`}
                selected={selectedBlockId === block.id}
                onSelect={() => onSelect(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
