import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BlockDefinition, BlockRegistry } from "@n-ramos/celebrimbor-core";

type BlockLibraryProps = {
  registry: BlockRegistry;
  onAdd: (definition: BlockDefinition) => void;
};

export function BlockLibrary({ registry, onAdd }: BlockLibraryProps) {
  const [query, setQuery] = useState("");
  const grouped = registry.byCategory();
  const filteredGroups = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return Object.entries(grouped)
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
  }, [grouped, query]);

  return (
    <aside className="sticky top-6 space-y-5 rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#082f49_0%,#155e75_48%,#cffafe_100%)] p-5 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">Library</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Glisse tes blocs</h2>
        <p className="mt-2 text-sm text-cyan-50/90">
          Drag &amp; drop depuis cette colonne ou clique pour inserer un bloc instantanement.
        </p>
      </div>
      <div>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-400 focus:bg-white"
          placeholder="Search blocks, tags, types"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="space-y-5">
        {filteredGroups.map(([category, definitions]) => (
          <div key={category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {category}
            </h3>
            <div className="grid gap-2">
              {definitions.map((definition) => (
                <LibraryCard
                  key={definition.type}
                  definition={definition}
                  onAdd={() => onAdd(definition)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

type LibraryCardProps = {
  definition: BlockDefinition;
  onAdd: () => void;
};

function LibraryCard({ definition, onAdd }: LibraryCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library:${definition.type}`,
    data: {
      definition,
      source: "library",
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="group rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_40px_-24px_rgba(8,145,178,0.45)]"
      style={{
        opacity: isDragging ? 0.55 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">{definition.label}</div>
          <div className="mt-1 text-sm text-slate-500">{definition.type}</div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition group-hover:border-cyan-200 group-hover:text-cyan-700">
          Drag
        </span>
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
  );
}
