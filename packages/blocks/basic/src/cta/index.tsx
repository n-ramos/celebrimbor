import { defineBlock } from "@n-ramos/celebrimbor-core";
import { Section } from "../shared/render-helpers";

export const ctaBlock = defineBlock({
  type: "cta",
  label: "CTA",
  category: "Marketing",
  defaultContent: {
    title: "Ready to launch?",
    text: "Connect the builder to your backend and ship faster.",
    buttonLabel: "Book a demo",
    buttonUrl: "#",
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
      { name: "buttonLabel", type: "text", label: "Button label" },
      { name: "buttonUrl", type: "url", label: "Button URL" },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      text?: string;
      buttonLabel?: string;
      buttonUrl?: string;
    };
    return (
      <Section>
        <div className="rounded-[2rem] bg-slate-950 px-8 py-12 text-white">
          <h2 className="text-3xl font-semibold">{content.title}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{content.text}</p>
          {content.buttonLabel ? (
            <a className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950" href={content.buttonUrl}>
              {content.buttonLabel}
            </a>
          ) : null}
        </div>
      </Section>
    );
  },
});
