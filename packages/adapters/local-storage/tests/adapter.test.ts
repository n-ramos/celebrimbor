import { beforeEach, describe, expect, it } from "vitest";
import type { PageDocument } from "@n-ramos/celebrimbor-core";
import { createLocalStorageAdapter } from "../src";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => map.delete(key),
    setItem: (key, value) => map.set(key, value),
  } satisfies Storage;
}

const doc: PageDocument = { version: "1.0.0", id: "home", blocks: [] };

describe("local-storage adapter", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("saves and loads a document with the default prefix", async () => {
    const adapter = createLocalStorageAdapter({ storage });
    await adapter.save(doc);

    expect(storage.getItem("my-page-builder:home")).toBeTypeOf("string");
    expect(await adapter.load("home")).toEqual(doc);
  });

  it("honours a custom key prefix", async () => {
    const adapter = createLocalStorageAdapter({ storage, keyPrefix: "cms" });
    await adapter.save(doc);
    expect(storage.getItem("cms:home")).toBeTypeOf("string");
  });

  it("falls back to the draft key when the document has no id", async () => {
    const adapter = createLocalStorageAdapter({ storage });
    await adapter.save({ version: "1.0.0", blocks: [] });
    expect(storage.getItem("my-page-builder:draft")).toBeTypeOf("string");
  });

  it("throws when loading a missing document", async () => {
    const adapter = createLocalStorageAdapter({ storage });
    await expect(adapter.load("ghost")).rejects.toThrow(/No page document/);
  });

  it("returns a local-storage uri from preview after persisting", async () => {
    const adapter = createLocalStorageAdapter({ storage });
    const uri = await adapter.preview!(doc);
    expect(uri).toBe("local-storage://my-page-builder:home");
    expect(storage.getItem("my-page-builder:home")).toBeTypeOf("string");
  });
});
