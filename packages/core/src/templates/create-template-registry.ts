import type { PageDocument } from "../document/types";
import type { DocumentTemplate } from "./define-template";

export type TemplateRegistry = ReturnType<typeof createTemplateRegistry>;

/**
 * Registry de templates de pages, calque sur l'API du `BlockRegistry`.
 * `instantiate` produit un nouveau `PageDocument` clone a chaque appel.
 */
export function createTemplateRegistry(initialTemplates: DocumentTemplate[] = []) {
  const templates = new Map<string, DocumentTemplate>();

  const api = {
    register(template: DocumentTemplate) {
      if (templates.has(template.name)) {
        throw new Error(`Template "${template.name}" is already registered.`);
      }
      templates.set(template.name, template);
      return api;
    },
    unregister(name: string) {
      templates.delete(name);
      return api;
    },
    get(name: string) {
      return templates.get(name);
    },
    has(name: string) {
      return templates.has(name);
    },
    all() {
      return [...templates.values()];
    },
    byCategory() {
      return api.all().reduce<Record<string, DocumentTemplate[]>>((accumulator, template) => {
        const category = template.category ?? "General";
        accumulator[category] ??= [];
        accumulator[category].push(template);
        return accumulator;
      }, {});
    },
    instantiate(name: string): PageDocument {
      const template = templates.get(name);
      if (!template) {
        throw new Error(`Template "${name}" is not registered.`);
      }
      return structuredClone(template.create());
    },
  };

  for (const template of initialTemplates) {
    api.register(template);
  }

  return api;
}
