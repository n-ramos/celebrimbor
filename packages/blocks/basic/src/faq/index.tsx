import { defineBlock } from "@n-ramos/celebrimbor-core";
import { Section } from "../shared/render-helpers";

export const faqBlock = defineBlock({
  type: "faq",
  label: "FAQ",
  category: "Content",
  defaultContent: {
    title: "Frequently asked questions",
    items: [
      { question: "Is the core framework agnostic?", answer: "Yes, the core package has no UI dependency." },
    ],
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title" },
      {
        name: "items",
        type: "array",
        label: "Items",
        of: {
          name: "faqItem",
          type: "object",
          label: "FAQ item",
          fields: [
            { name: "question", type: "text", label: "Question", required: true },
            { name: "answer", type: "textarea", label: "Answer", required: true },
          ],
        },
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      items?: Array<{ question?: string; answer?: string }>;
    };
    return (
      <Section>
        <h2 className="text-3xl font-semibold text-slate-950">{content.title}</h2>
        <div className="mt-6 space-y-4">
          {(content.items ?? []).map((item, index) => (
            <details key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-medium text-slate-900">{item.question}</summary>
              <p className="mt-3 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>
    );
  },
});
