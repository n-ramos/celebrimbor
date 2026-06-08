type BlockToolbarProps = {
  canSave?: boolean;
  saving?: boolean;
  onSave?: () => Promise<void>;
};

export function BlockToolbar({ canSave, saving, onSave }: BlockToolbarProps) {
  return (
    <div className="overflow-hidden rounded-[1.85rem] border border-slate-200 bg-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(120deg,#082f49_0%,#164e63_42%,#f0fdfa_100%)] px-6 py-5">
        <div className="max-w-2xl text-white">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">Agnostic Page Builder</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Edition visuelle, sortie JSON portable</h1>
          <p className="mt-3 text-sm text-cyan-50/90">
            Sidebar de blocs a gauche, preview centrale en direct, et rendu JSON portable pour embarquer le module
            partout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            React UI
          </span>
          <button
            type="button"
            disabled={!canSave || saving}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)] transition disabled:opacity-50"
            onClick={() => void onSave?.()}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
