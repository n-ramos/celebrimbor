import { describe, expect, it } from "vitest";
import {
  createBlockRegistry,
  defineBlock,
  escapeHtml,
  renderDocumentToHtml,
  type PageDocument,
} from "../src";

const heroHtml = defineBlock({
  type: "hero",
  label: "Hero",
  defaultContent: { title: "" },
  schema: { fields: [] },
  renderHtml: ({ block }) => `<h1>${escapeHtml(String((block.content as { title?: string }).title ?? ""))}</h1>`,
});

const sectionBlock = defineBlock({
  type: "section",
  label: "Section",
  supportsChildren: true,
  defaultContent: {},
  schema: { fields: [] },
  renderHtml: ({ childrenHtml }) => `<section>${childrenHtml}</section>`,
});

const registry = createBlockRegistry([heroHtml, sectionBlock]);

const document: PageDocument = {
  version: "1.0.0",
  blocks: [
    {
      id: "s1",
      type: "section",
      content: {},
      children: [
        { id: "h1", type: "hero", content: { title: "Hello <world>" } },
        { id: "h2", type: "hero", content: { title: "Hidden" }, visible: false },
      ],
    },
  ],
};

describe("renderDocumentToHtml", () => {
  it("uses definition.renderHtml and nests children", () => {
    const html = renderDocumentToHtml(document, registry);
    expect(html).toBe("<section><h1>Hello &lt;world&gt;</h1></section>");
  });

  it("skips invisible blocks", () => {
    const html = renderDocumentToHtml(document, registry);
    expect(html).not.toContain("Hidden");
  });

  it("lets options.renderers override the definition", () => {
    const html = renderDocumentToHtml(document, registry, {
      renderers: { hero: ({ block }) => `[${(block.content as { title?: string }).title}]` },
    });
    expect(html).toContain("[Hello <world>]");
  });

  it("falls back to a generic wrapper for blocks without an HTML renderer", () => {
    const plain = createBlockRegistry([
      defineBlock({ type: "plain", label: "Plain", defaultContent: {}, schema: { fields: [] } }),
    ]);
    const doc: PageDocument = {
      version: "1.0.0",
      blocks: [{ id: "p1", type: "plain", content: { text: "hi" } }],
    };
    const html = renderDocumentToHtml(doc, plain);
    expect(html).toBe('<div data-block-type="plain" data-block-id="p1">hi</div>');
  });
});
