import { describe, expect, it } from "vitest";
import {
  createBlockRegistry,
  createUnknownBlockDefinition,
  type AnyBlockDefinition,
} from "../src";
import { containerBlock, heroBlock } from "./fixtures";

describe("registry", () => {
  it("registers, reports and lists definitions", () => {
    const registry = createBlockRegistry([heroBlock, containerBlock]);
    expect(registry.has("hero")).toBe(true);
    expect(registry.get("hero")?.label).toBe("Hero");
    expect(registry.all().map((d) => d.type).sort()).toEqual(["container", "hero"]);
  });

  it("throws when registering a duplicate type", () => {
    const registry = createBlockRegistry([heroBlock]);
    expect(() => registry.register(heroBlock)).toThrow(/already registered/);
  });

  it("groups definitions by category", () => {
    const registry = createBlockRegistry([heroBlock, containerBlock]);
    const grouped = registry.byCategory();
    expect(grouped.Marketing?.map((d) => d.type)).toEqual(["hero"]);
    expect(grouped.Layout?.map((d) => d.type)).toEqual(["container"]);
  });

  it("unregisters a type", () => {
    const registry = createBlockRegistry([heroBlock]);
    registry.unregister("hero");
    expect(registry.has("hero")).toBe(false);
  });

  it("resolves lazily loaded definitions and caches them", async () => {
    const registry = createBlockRegistry();
    let calls = 0;
    registry.registerLazy("lazy", async () => {
      calls += 1;
      return { type: "lazy", label: "Lazy", defaultContent: {}, schema: { fields: [] } } satisfies AnyBlockDefinition;
    });

    expect(registry.has("lazy")).toBe(true);
    const first = await registry.resolve("lazy");
    const second = await registry.resolve("lazy");
    expect(first?.type).toBe("lazy");
    expect(second).toBe(first);
    expect(calls).toBe(1);
  });

  it("falls back to the unknown block factory", () => {
    const registry = createBlockRegistry();
    registry.setUnknownBlockFactory(createUnknownBlockDefinition);

    const definition = registry.get("ghost");
    expect(definition?.label).toBe("Unknown: ghost");
    // `has` stays false: the factory is a fallback, not a registration.
    expect(registry.has("ghost")).toBe(false);
  });

  it("creates blocks from a registered definition with overrides", () => {
    const registry = createBlockRegistry([heroBlock]);
    const block = registry.createBlock("hero", { content: { title: "Hi", text: "" } });
    expect(block.type).toBe("hero");
    expect(block.content).toEqual({ title: "Hi", text: "" });
    expect(block.id).toBeTypeOf("string");
  });
});
