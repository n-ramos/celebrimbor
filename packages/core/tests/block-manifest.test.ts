import { describe, expect, it, vi } from "vitest";
import {
  createBlockCatalog,
  createBlockRegistry,
  registerBlockManifest,
  type AnyBlockDefinition,
  type BlockManifestEntry,
} from "../src";

function entry(type: string, category: string, load: () => Promise<AnyBlockDefinition>): BlockManifestEntry {
  return { type, label: type, category, tags: [`tag-${type}`], load };
}

describe("registerBlockManifest", () => {
  it("registers each entry as a lazy block", () => {
    const registry = createBlockRegistry();
    const load = vi.fn(async () => ({ type: "promo", label: "Promo", defaultContent: {}, schema: { fields: [] } }));
    registerBlockManifest(registry, [entry("promo", "Marketing", load)]);

    expect(registry.has("promo")).toBe(true);
    expect(registry.get("promo")).toBeUndefined(); // not loaded yet
    expect(load).not.toHaveBeenCalled();
  });

  it("resolves a lazy block on demand and caches it", async () => {
    const registry = createBlockRegistry();
    const load = vi.fn(async () => ({ type: "promo", label: "Promo", defaultContent: {}, schema: { fields: [] } }));
    registerBlockManifest(registry, [entry("promo", "Marketing", load)]);

    const resolved = await registry.resolve("promo");
    expect(resolved?.type).toBe("promo");
    await registry.resolve("promo");
    expect(load).toHaveBeenCalledOnce();
  });

  it("is idempotent and skips already-registered types", () => {
    const registry = createBlockRegistry();
    const manifest = [entry("promo", "Marketing", async () => ({ type: "promo", label: "P", defaultContent: {}, schema: { fields: [] } }))];
    registerBlockManifest(registry, manifest);
    expect(() => registerBlockManifest(registry, manifest)).not.toThrow();
  });
});

describe("createBlockCatalog", () => {
  const catalog = createBlockCatalog([
    entry("hero", "Marketing", async () => ({ type: "hero", label: "Hero", defaultContent: {}, schema: { fields: [] } })),
    entry("faq", "Content", async () => ({ type: "faq", label: "FAQ", defaultContent: {}, schema: { fields: [] } })),
  ]);

  it("lists entries without loading them", () => {
    expect(catalog.entries().map((e) => e.type).sort()).toEqual(["faq", "hero"]);
  });

  it("groups entries by category", () => {
    expect(catalog.byCategory().Marketing?.map((e) => e.type)).toEqual(["hero"]);
  });

  it("searches across type, label and tags", () => {
    expect(catalog.search("tag-faq").map((e) => e.type)).toEqual(["faq"]);
    expect(catalog.search("").map((e) => e.type).sort()).toEqual(["faq", "hero"]);
  });
});
