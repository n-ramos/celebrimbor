import { defineBlock } from "@n-ramos/core";
import { Section } from "../shared/render-helpers";

export const imageTextBlock = defineBlock({
  type: "image-text",
  label: "Image + Text",
  category: "Marketing",
  defaultContent: {
    title: "Explain your feature",
    text: "Pair a strong visual with persuasive copy.",
    image: null,
    imageAlt: "",
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
      { name: "image", type: "asset", label: "Image" },
      { name: "imageAlt", type: "text", label: "Image alt" },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      text?: string;
      image?: { url?: string } | null;
      imageAlt?: string;
    };
    return (
      <Section>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{content.title}</h2>
            <p className="mt-4 text-slate-600">{content.text}</p>
          </div>
          {content.image?.url ? (
            <img className="rounded-3xl border border-slate-200" src={content.image.url} alt={content.imageAlt ?? ""} />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              Add an image
            </div>
          )}
        </div>
      </Section>
    );
  },
});
