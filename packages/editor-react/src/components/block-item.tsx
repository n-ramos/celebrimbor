import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageBlock } from "@n-ramos/celebrimbor-core";

type BlockItemProps = {
  block: PageBlock;
  label: string;
  selected?: boolean;
  onSelect: () => void;
};

export function BlockItem({ block, label, selected, onSelect }: BlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <article
      ref={setNodeRef}
      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
        selected
          ? "border-cyan-400 bg-cyan-50/80 shadow-[0_18px_45px_-28px_rgba(6,182,212,0.55)]"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      style={{
        opacity: isDragging ? 0.55 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <button type="button" className="text-left" onClick={onSelect}>
            <div className="font-medium text-slate-900">{label}</div>
            <div className="mt-1 text-sm text-slate-500">{block.type}</div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
              block.visible ?? true
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {block.visible ?? true ? "Visible" : "Hidden"}
          </span>
          <button
            type="button"
            className="cursor-grab rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 active:cursor-grabbing"
            aria-label={`Drag ${label}`}
            {...attributes}
            {...listeners}
          >
            Grip
          </button>
        </div>
      </div>
    </article>
  );
}
