import type { PageBuilderStorage, PageDocument } from "@n-ramos/core";

export type LocalStorageAdapterOptions = {
  keyPrefix?: string;
  storage?: Storage;
};

export function createLocalStorageAdapter(
  options: LocalStorageAdapterOptions = {},
): PageBuilderStorage {
  const storage = options.storage ?? globalThis.localStorage;
  const keyPrefix = options.keyPrefix ?? "my-page-builder";
  const api: PageBuilderStorage = {
    async load(id: string): Promise<PageDocument> {
      const raw = storage.getItem(toKey(keyPrefix, id));
      if (!raw) {
        throw new Error(`No page document found for "${id}".`);
      }

      return JSON.parse(raw) as PageDocument;
    },
    async save(document: PageDocument): Promise<void> {
      const id = document.id ?? "draft";
      storage.setItem(toKey(keyPrefix, id), JSON.stringify(document));
    },
    async preview(document: PageDocument): Promise<string> {
      const id = document.id ?? "draft";
      await api.save(document);
      return `local-storage://${toKey(keyPrefix, id)}`;
    },
  };

  return api;
}

function toKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}
