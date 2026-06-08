import { useMemo, useState } from "react";
import { Code2, Eye, Monitor, Smartphone } from "lucide-react";
import type { BlockRegistry, PageDocument } from "@n-ramos/core";
import { PageRenderer } from "../renderer/page-renderer";
import { PortableJsonPanel } from "./portable-json-panel";

type PreviewFrameProps = {
  document: PageDocument;
  registry: BlockRegistry;
};

export function PreviewFrame({ document, registry }: PreviewFrameProps) {
  const previewKey = useMemo(() => JSON.stringify(document), [document]);
  const [tab, setTab] = useState<"preview" | "json">("preview");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("desktop");

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <section className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Eye className="h-4 w-4" />
            Live Preview
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Rendu & sortie JSON</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                tab === "preview" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => setTab("preview")}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                tab === "json" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => setTab("json")}
            >
              <Code2 className="h-4 w-4" />
              JSON
            </button>
          </div>
          <div className="rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                viewport === "mobile" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => setViewport("mobile")}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                viewport === "desktop" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
              onClick={() => setViewport("desktop")}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
          </div>
        </div>
      </section>

      {tab === "preview" ? (
        <section className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_25px_80px_-48px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-sm font-medium text-slate-600">{document.title ?? "Mon site"}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {viewport === "mobile" ? "375px" : "1440px"}
              </div>
            </div>
            <div className="min-h-[calc(100vh-12rem)] overflow-auto p-6">
              <div
                className={`mx-auto overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_90px_-54px_rgba(15,23,42,0.35)] transition-all ${
                  viewport === "mobile" ? "max-w-[390px]" : "max-w-none"
                }`}
              >
                <div key={previewKey} className="min-h-[820px] bg-white">
                  <PageRenderer document={document} registry={registry} />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6">
          <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_25px_80px_-48px_rgba(15,23,42,0.35)]">
            <PortableJsonPanel document={document} />
          </div>
        </section>
      )}
    </div>
  );
}
