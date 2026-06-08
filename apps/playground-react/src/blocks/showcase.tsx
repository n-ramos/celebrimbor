import { defineBlock } from "@n-ramos/celebrimbor-core";

type ShowcaseContent = {
  title?: string;
  body?: string;
  accent?: string;
  align?: "left" | "center" | "right";
  textAlign?: "left" | "center" | "right" | "justify";
  size?: number;
  publishedAt?: string;
};

const ALIGN_TO_JUSTIFY: Record<NonNullable<ShowcaseContent["align"]>, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

/**
 * Bloc de demonstration des champs "structurels" facon ciklik:
 * - `tabs` (Contenu / Apparence) et `row` (deux champs cote a cote) pour la
 *   mise en forme du formulaire (les enfants ecrivent a plat).
 * - `custom` (`color-swatch`) branche via le registre `customFields`.
 */
export const showcaseBlock = defineBlock({
  type: "showcase",
  label: "Showcase",
  category: "Content",
  tags: ["demo", "fields"],
  defaultContent: {
    title: "Tous les champs",
    body: "Onglets, lignes et champ custom.",
    accent: "#6366f1",
    align: "center",
    textAlign: "center",
    size: 28,
    publishedAt: "",
  },
  schema: {
    fields: [
      {
        type: "tabs",
        tabs: [
          {
            label: "Contenu",
            fields: [
              { name: "title", type: "text", label: "Titre", required: true },
              { name: "body", type: "textarea", label: "Texte" },
              { name: "publishedAt", type: "date", label: "Date de publication" },
            ],
          },
          {
            label: "Apparence",
            fields: [
              { name: "accent", type: "custom", label: "Couleur d'accent", component: "color-swatch" },
              { name: "size", type: "range", label: "Taille du titre", min: 16, max: 64, step: 1, defaultValue: 28 },
              {
                type: "row",
                label: "Alignement",
                fields: [
                  { name: "align", type: "alignment", label: "Bloc", defaultValue: "center" },
                  { name: "textAlign", type: "textalign", label: "Texte", defaultValue: "center" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as ShowcaseContent;
    const align = content.align ?? "center";
    const textAlign = content.textAlign ?? "center";

    return (
      <div style={{ display: "flex", justifyContent: ALIGN_TO_JUSTIFY[align], padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: "40rem", textAlign }}>
          <h2 style={{ fontSize: `${content.size ?? 28}px`, color: content.accent ?? "#0f172a", fontWeight: 700 }}>
            {content.title}
          </h2>
          <p style={{ marginTop: "0.75rem", color: "#475569" }}>{content.body}</p>
          {content.publishedAt ? (
            <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#94a3b8" }}>{content.publishedAt}</p>
          ) : null}
        </div>
      </div>
    );
  },
});
