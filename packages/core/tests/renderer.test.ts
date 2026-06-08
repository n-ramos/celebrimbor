import { describe, expect, it } from "vitest";
import { createBlockRegistry, renderDocument, type PageDocument } from "../src";
import { containerBlock, heroBlock } from "./fixtures";

const registry = createBlockRegistry([heroBlock, containerBlock]);

const document: PageDocument = {
  version: "1.0.0",
  blocks: [
    {
      id: "container",
      type: "container",
      content: {},
      children: [
        { id: "visible", type: "hero", content: { title: "A", text: "" } },
        { id: "hidden", type: "hero", content: { title: "B", text: "" }, visible: false },
      ],
    },
    { id: "ghost", type: "unknown-type", content: {} },
  ],
};

describe("renderer/renderDocument", () => {
  it("renders to an arbitrary output via a strategy", () => {
    const output = renderDocument(document, registry, ({ block, children }) =>
      `<${block.type}>${children.join("")}</${block.type}>`,
    );
    expect(output).toEqual(["<container><hero></hero></container>", "<unknown-type></unknown-type>"]);
  });

  it("skips invisible children", () => {
    const seen: string[] = [];
    renderDocument(document, registry, ({ block, children }) => {
      seen.push(block.id);
      return children;
    });
    expect(seen).toContain("visible");
    expect(seen).not.toContain("hidden");
  });

  it("passes the resolved definition (undefined for unknown types)", () => {
    const defs: Array<string | undefined> = [];
    renderDocument(document, registry, ({ block, definition, children }) => {
      defs.push(definition?.type);
      return [block.id, ...children.flat()];
    });
    expect(defs).toContain("container");
    expect(defs).toContain(undefined);
  });
});
