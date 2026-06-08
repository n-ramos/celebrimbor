import { defineBlock } from "@n-ramos/core";
import { Section } from "../shared/render-helpers";

export const columnsBlock = defineBlock({
  type: "columns",
  label: "Columns",
  category: "Layout",
  supportsChildren: true,
  defaultContent: {
    title: "Three ways to structure a message",
    columns: [
      { title: "Composable", text: "Model blocks as serializable JSON." },
      { title: "Portable", text: "Persist content wherever you want." },
      { title: "Extensible", text: "Layer adapters and UI packages independently." },
    ],
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title" },
      {
        name: "columns",
        type: "array",
        label: "Columns",
        minItems: 1,
        of: {
          name: "column",
          type: "object",
          label: "Column",
          fields: [
            { name: "title", type: "text", label: "Title", required: true },
            { name: "text", type: "textarea", label: "Text" },
          ],
        },
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      columns?: Array<{ title?: string; text?: string }>;
    };
    return (
      <Section>
        <h2 className="text-3xl font-semibold text-slate-950">{content.title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(content.columns ?? []).map((column, index) => (
            <article key={index} className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">{column.title}</h3>
              <p className="mt-3 text-slate-600">{column.text}</p>
            </article>
          ))}
        </div>
      </Section>
    );
  },
});
