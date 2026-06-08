import { useMemo } from "react";
import { serializePortableDocument, type PageDocument } from "@n-ramos/celebrimbor-core";

type PortableJsonPanelProps = {
  document: PageDocument;
};

export function PortableJsonPanel({ document }: PortableJsonPanelProps) {
  const portable = useMemo(
    () => JSON.stringify(serializePortableDocument(document), null, 2),
    [document],
  );

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Portable JSON</div>
        <p className="mt-2 max-w-sm text-sm text-slate-300">
          Format de transport agnostique inspire de l&apos;approche `ciklik/visual-editor`.
        </p>
      </div>
      <pre className="max-h-[340px] overflow-auto bg-slate-950/98 px-5 py-5 text-xs leading-6 text-cyan-100">
        <code>{portable}</code>
      </pre>
    </section>
  );
}
