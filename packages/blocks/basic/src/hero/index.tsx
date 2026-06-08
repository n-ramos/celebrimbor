import { defineBlock } from "@n-ramos/celebrimbor-core";
import { Section } from "../shared/render-helpers";

export const heroBlock = defineBlock({
  type: "hero",
  label: "Hero",
  category: "Marketing",
  tags: ["banner", "headline", "landing"],
  defaultContent: {
    eyebrow: "",
    title: "Build pages visually",
    text: "Compose rich pages block by block with a headless TypeScript engine.",
    primaryButton: {
      label: "Start now",
      url: "#",
    },
    secondaryButton: {
      label: "Read docs",
      url: "#docs",
    },
    image: null,
    imageAlt: "",
  },
  defaultSettings: {
    alignment: "left",
    spacingTop: "lg",
    spacingBottom: "lg",
  },
  schema: {
    fields: [
      { name: "eyebrow", type: "text", label: "Eyebrow" },
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
      {
        name: "primaryButton",
        type: "object",
        label: "Primary button",
        fields: [
          { name: "label", type: "text", label: "Label" },
          { name: "url", type: "url", label: "URL" },
        ],
      },
      {
        name: "secondaryButton",
        type: "object",
        label: "Secondary button",
        fields: [
          { name: "label", type: "text", label: "Label" },
          { name: "url", type: "url", label: "URL" },
        ],
      },
      { name: "image", type: "asset", label: "Image" },
      { name: "imageAlt", type: "text", label: "Image alt" },
    ],
  },
  settingsSchema: {
    fields: [
      {
        name: "alignment",
        type: "radio",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
        ],
      },
      {
        name: "spacingTop",
        type: "select",
        label: "Top spacing",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      {
        name: "spacingBottom",
        type: "select",
        label: "Bottom spacing",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      eyebrow?: string;
      title?: string;
      text?: string;
      primaryButton?: { label?: string; url?: string };
      secondaryButton?: { label?: string; url?: string };
      image?: { url?: string } | null;
      imageAlt?: string;
    };
    const settings = (block.settings as { alignment?: string }) ?? {};

    return (
      <Section className={settings.alignment === "center" ? "text-center" : ""}>
        {content.eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
          {content.title}
        </h1>
        {content.text ? (
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{content.text}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {content.primaryButton?.label ? (
            <a className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white" href={content.primaryButton.url}>
              {content.primaryButton.label}
            </a>
          ) : null}
          {content.secondaryButton?.label ? (
            <a className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900" href={content.secondaryButton.url}>
              {content.secondaryButton.label}
            </a>
          ) : null}
        </div>
        {content.image?.url ? (
          <img
            className="mt-10 rounded-3xl border border-slate-200 object-cover shadow-sm"
            src={content.image.url}
            alt={content.imageAlt ?? ""}
          />
        ) : null}
      </Section>
    );
  },
});
