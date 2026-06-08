import { defineBlock } from "@n-ramos/celebrimbor-core";
import { Section } from "../shared/render-helpers";

export const richTextBlock = defineBlock({
  type: "rich-text",
  label: "Rich text",
  category: "Content",
  tags: ["wysiwyg", "text", "body"],
  defaultContent: {
    body: "<p>Tell your story with a flexible rich text block.</p>",
  },
  schema: {
    fields: [{ name: "body", type: "richtext", label: "Body", required: true }],
  },
  render: ({ block }) => {
    const content = block.content as { body?: string };
    return (
      <Section>
        <div
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: content.body ?? "" }}
        />
      </Section>
    );
  },
});
