import type { LazyBlockLoader } from "../block/types";
import type { BlockRegistry } from "./create-block-registry";

/**
 * Entree de manifeste decrivant un bloc distribuable ("marketplace"). Les
 * metadonnees (label, category, icon, tags) permettent d'afficher le bloc dans
 * une librairie **avant** de charger sa definition complete via `load`.
 */
export type BlockManifestEntry = {
  type: string;
  label?: string | undefined;
  description?: string | undefined;
  category?: string | undefined;
  icon?: string | undefined;
  tags?: string[] | undefined;
  load: LazyBlockLoader;
};

/**
 * Enregistre chaque entree d'un manifeste comme bloc lazy dans le registry.
 * Les types deja enregistres sont ignores (operation idempotente), ce qui
 * permet de fusionner plusieurs manifestes sans collision.
 */
export function registerBlockManifest(
  registry: BlockRegistry,
  entries: BlockManifestEntry[],
): BlockRegistry {
  for (const entry of entries) {
    if (!registry.has(entry.type)) {
      registry.registerLazy(entry.type, entry.load);
    }
  }
  return registry;
}

export type BlockCatalog = ReturnType<typeof createBlockCatalog>;

/**
 * Catalogue en lecture seule des entrees d'un manifeste, pour piloter une UI
 * de librairie de blocs (listing, recherche, regroupement par categorie) sans
 * declencher de chargement.
 */
export function createBlockCatalog(entries: BlockManifestEntry[]) {
  const all = [...entries];

  const api = {
    entries() {
      return [...all];
    },
    get(type: string) {
      return all.find((entry) => entry.type === type);
    },
    byCategory() {
      return all.reduce<Record<string, BlockManifestEntry[]>>((accumulator, entry) => {
        const category = entry.category ?? "General";
        accumulator[category] ??= [];
        accumulator[category].push(entry);
        return accumulator;
      }, {});
    },
    search(query: string) {
      const needle = query.trim().toLowerCase();
      if (!needle) {
        return [...all];
      }
      return all.filter((entry) =>
        [entry.type, entry.label, entry.description, ...(entry.tags ?? [])]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle)),
      );
    },
  };

  return api;
}
