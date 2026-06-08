import { defineBlock } from "@n-ramos/celebrimbor-core";

// Example custom block declared host-side (TypeScript). The editor preview is
// this React render; the PUBLIC/preview render is the matching Blade view
// (resources/views/blocks/testimonial.blade.php) with the host's own CSS.

type TestimonialContent = {
  quote?: string;
  author?: string;
  role?: string;
  avatar?: { url?: string; alt?: string } | null;
};

export const testimonialBlock = defineBlock({
  type: "testimonial",
  label: "Testimonial",
  category: "Content",
  tags: ["quote", "social proof"],
  defaultContent: {
    quote: "This builder changed our workflow.",
    author: "Jane Doe",
    role: "Head of Marketing",
    avatar: null,
  },
  schema: {
    fields: [
      { name: "quote", type: "textarea", label: "Quote", required: true },
      { name: "author", type: "text", label: "Author" },
      { name: "role", type: "text", label: "Role" },
      { name: "avatar", type: "asset", label: "Avatar" },
    ],
  },
  render: ({ block }) => {
    const content = block.content as TestimonialContent;

    return (
      <figure style={{ maxWidth: "42rem", margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
        {content.avatar?.url ? (
          <img
            src={content.avatar.url}
            alt={content.avatar.alt ?? content.author ?? ""}
            style={{ width: "4rem", height: "4rem", borderRadius: "9999px", objectFit: "cover", margin: "0 auto" }}
          />
        ) : null}
        <blockquote style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 500 }}>
          “{content.quote}”
        </blockquote>
        <figcaption style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#64748b" }}>
          <strong>{content.author}</strong>
          {content.role ? ` — ${content.role}` : null}
        </figcaption>
      </figure>
    );
  },
});
