import { afterEach, describe, expect, it } from "vitest";
import { createBlockRegistry, defineBlock, type PortableBlock } from "@n-ramos/celebrimbor-core";
import { definePageBuilderElement, PageBuilderElement } from "../src";

const heroBlock = defineBlock({
  type: "hero",
  label: "Hero",
  defaultContent: { title: "" },
  schema: { fields: [{ name: "title", type: "text", label: "Title" }] },
});

let tagCounter = 0;
function mountElement(format: "portable" | "document" = "portable") {
  const registry = createBlockRegistry([heroBlock]);
  const tagName = `mpb-test-${(tagCounter += 1)}`;
  definePageBuilderElement({ registry, tagName });

  const element = document.createElement(tagName) as PageBuilderElement;
  element.setAttribute("format", format);
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("PageBuilderElement", () => {
  it("returns the same class when defined twice for a tag", () => {
    const registry = createBlockRegistry([heroBlock]);
    const a = definePageBuilderElement({ registry, tagName: "mpb-stable" });
    const b = definePageBuilderElement({ registry, tagName: "mpb-stable" });
    expect(a).toBe(b);
  });

  it("parses a portable JSON array passed via the value attribute", () => {
    const element = mountElement();
    const portable: PortableBlock[] = [{ _name: "hero", title: "Hello" }];
    element.setAttribute("value", JSON.stringify(portable));

    const doc = element.pageDocument;
    expect(doc.blocks[0]?.type).toBe("hero");
    expect(doc.blocks[0]?.content).toEqual({ title: "Hello" });
  });

  it("serializes its value as a flat portable array by default", () => {
    const element = mountElement("portable");
    element.setAttribute("value", JSON.stringify([{ _name: "hero", title: "Hi" }]));

    const parsed = JSON.parse(element.value) as PortableBlock[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toMatchObject({ _name: "hero", title: "Hi" });
  });

  it("serializes a full document when format is 'document'", () => {
    const element = mountElement("document");
    element.setAttribute("value", JSON.stringify([{ _name: "hero", title: "Hi" }]));

    const parsed = JSON.parse(element.value) as { version: string; blocks: unknown[] };
    expect(parsed).toHaveProperty("version");
    expect(Array.isArray(parsed.blocks)).toBe(true);
  });

  it("keeps the hidden textarea in sync with the document and the name attribute", () => {
    const element = mountElement();
    element.setAttribute("name", "document");
    element.setAttribute("value", JSON.stringify([{ _name: "hero", title: "Sync" }]));

    const textarea = element.querySelector("textarea");
    expect(textarea?.name).toBe("document");
    expect(textarea?.value).toContain("Sync");
  });

  it("round-trips a document through the pageDocument accessor (defensive clone)", () => {
    const element = mountElement();
    const source = { version: "1.0.0", id: "page", blocks: [] };
    element.pageDocument = source;

    const read = element.pageDocument;
    expect(read).toEqual(source);
    // The accessor must hand back a clone, not the stored reference.
    expect(read).not.toBe(source);
  });
});
