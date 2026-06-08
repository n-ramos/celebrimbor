import type { PageDocument } from "../document/types";

/**
 * Un template de page : une fabrique nommee de `PageDocument`. `create` doit
 * renvoyer un nouveau document a chaque appel (aucun etat partage).
 */
export type DocumentTemplate = {
  name: string;
  label: string;
  description?: string | undefined;
  category?: string | undefined;
  create: () => PageDocument;
};

export function defineTemplate(template: DocumentTemplate): DocumentTemplate {
  return template;
}
