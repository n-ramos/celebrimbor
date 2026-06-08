import { defineBlock } from "@n-ramos/celebrimbor-core";

// Example custom block declared host-side (TypeScript). The editor preview is
// this React render; the PUBLIC/preview render is the matching Blade view
// (resources/views/blocks/testimonial.blade.php) with the host's own CSS.

type Align = "left" | "center" | "right";
type TextAlign = Align | "justify";

type TestimonialContent = {
  quote?: string;
  author?: string;
  role?: string;
  avatar?: { url?: string; alt?: string } | null;
  rating?: number;
  date?: string;
  align?: Align;
  textAlign?: TextAlign;
  accent?: string;
};

const ALIGN_TO_MARGIN: Record<Align, string> = {
  left: "0",
  center: "0 auto",
  right: "0 0 0 auto",
};

function formatDate(value?: string): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

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
    rating: 5,
    date: "",
    align: "center",
    textAlign: "center",
    accent: "#6366f1",
  },
  schema: {
    // Champs organises en onglets (Contenu / Style). `row` et `tabs` sont des
    // conteneurs de presentation: leurs enfants ecrivent a plat dans le contenu
    // (pas de cle imbriquee), ils servent uniquement a structurer le formulaire.
    fields: [
      {
        type: "tabs",
        tabs: [
          {
            label: "Contenu",
            fields: [
              { name: "quote", type: "textarea", label: "Quote", required: true },
              { name: "author", type: "text", label: "Author" },
              { name: "role", type: "text", label: "Role" },
              { name: "avatar", type: "asset", label: "Avatar" },
            ],
          },
          {
            label: "Style",
            fields: [
              { name: "rating", type: "range", label: "Rating", min: 0, max: 5, step: 1, defaultValue: 5 },
              { name: "date", type: "date", label: "Date" },
              {
                name: "accent",
                type: "custom",
                label: "Accent color",
                component: "color-swatch",
                options: { presets: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"] },
              },
              {
                type: "row",
                label: "Alignement",
                fields: [
                  { name: "align", type: "alignment", label: "Block alignment", defaultValue: "center" },
                  { name: "textAlign", type: "textalign", label: "Text alignment", defaultValue: "center" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as TestimonialContent;
    const align = content.align ?? "center";
    const textAlign = content.textAlign ?? "center";
    const rating = typeof content.rating === "number" ? Math.max(0, Math.min(5, Math.round(content.rating))) : 0;
    const formattedDate = formatDate(content.date);
    const accent = content.accent ?? "#f59e0b";

    return (
      <figure
        style={{
          maxWidth: "42rem",
          margin: ALIGN_TO_MARGIN[align],
          padding: "3rem 1.5rem",
          textAlign,
          borderTop: `3px solid ${accent}`,
        }}
      >
        {content.avatar?.url ? (
          <img
            src={content.avatar.url}
            alt={content.avatar.alt ?? content.author ?? ""}
            style={{ width: "4rem", height: "4rem", borderRadius: "9999px", objectFit: "cover", margin: "0 auto" }}
          />
        ) : null}
        {rating > 0 ? (
          <div aria-label={`${rating}/5`} style={{ marginTop: "1rem", color: accent, letterSpacing: "0.1em" }}>
            {"★".repeat(rating)}
            <span style={{ color: "#cbd5e1" }}>{"★".repeat(5 - rating)}</span>
          </div>
        ) : null}
        <blockquote style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 500 }}>
          “{content.quote}”
        </blockquote>
        <figcaption style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#64748b" }}>
          <strong>{content.author}</strong>
          {content.role ? ` — ${content.role}` : null}
          {formattedDate ? <div style={{ marginTop: "0.25rem", color: "#94a3b8" }}>{formattedDate}</div> : null}
        </figcaption>
      </figure>
    );
  },
});
