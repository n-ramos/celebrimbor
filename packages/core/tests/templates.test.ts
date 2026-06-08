import { describe, expect, it } from "vitest";
import { createDocument, createTemplateRegistry, defineTemplate } from "../src";

const landing = defineTemplate({
  name: "landing",
  label: "Landing page",
  category: "Marketing",
  create: () => createDocument({ title: "Landing", blocks: [] }),
});

const blank = defineTemplate({
  name: "blank",
  label: "Blank",
  create: () => createDocument(),
});

describe("template registry", () => {
  it("registers and lists templates", () => {
    const registry = createTemplateRegistry([landing, blank]);
    expect(registry.has("landing")).toBe(true);
    expect(registry.all()).toHaveLength(2);
  });

  it("throws on duplicate registration", () => {
    const registry = createTemplateRegistry([landing]);
    expect(() => registry.register(landing)).toThrow(/already registered/);
  });

  it("groups templates by category", () => {
    const registry = createTemplateRegistry([landing, blank]);
    const grouped = registry.byCategory();
    expect(grouped.Marketing?.map((t) => t.name)).toEqual(["landing"]);
    expect(grouped.General?.map((t) => t.name)).toEqual(["blank"]);
  });

  it("instantiates a fresh, isolated document each time", () => {
    const registry = createTemplateRegistry([landing]);
    const first = registry.instantiate("landing");
    const second = registry.instantiate("landing");

    expect(first.title).toBe("Landing");
    expect(first).not.toBe(second);
    first.blocks.push({ id: "x", type: "hero", content: {} });
    expect(second.blocks).toHaveLength(0);
  });

  it("throws when instantiating an unknown template", () => {
    const registry = createTemplateRegistry();
    expect(() => registry.instantiate("ghost")).toThrow(/not registered/);
  });
});
