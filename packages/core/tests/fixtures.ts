import { z } from "zod";
import { defineBlock } from "../src";

/**
 * Bloc feuille simple utilise dans la majorite des tests.
 * Contenu: title (requis) + text. Reglages: alignment (select).
 */
export const heroBlock = defineBlock({
  type: "hero",
  label: "Hero",
  category: "Marketing",
  defaultContent: {
    title: "",
    text: "",
  },
  defaultSettings: {
    alignment: "left",
  },
  schema: {
    zodSchema: z.object({
      title: z.string().min(1),
      text: z.string(),
    }),
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
    ],
  },
  settingsSchema: {
    fields: [
      {
        name: "alignment",
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
        ],
      },
    ],
  },
});

/**
 * Bloc conteneur acceptant des enfants, pour tester l'arborescence.
 */
export const containerBlock = defineBlock({
  type: "container",
  label: "Container",
  category: "Layout",
  supportsChildren: true,
  defaultContent: {},
  schema: { fields: [] },
});

/**
 * Bloc avec un champ array d'objets pour tester la validation repeatable.
 */
export const faqBlock = defineBlock({
  type: "faq",
  label: "FAQ",
  category: "Content",
  defaultContent: {
    items: [{ question: "Q", answer: "A" }],
  },
  schema: {
    fields: [
      {
        name: "items",
        type: "array",
        label: "Items",
        minItems: 1,
        maxItems: 3,
        of: {
          name: "item",
          type: "object",
          label: "Item",
          fields: [
            { name: "question", type: "text", label: "Question", required: true },
            { name: "answer", type: "textarea", label: "Answer", required: true },
          ],
        },
      },
    ],
  },
});
