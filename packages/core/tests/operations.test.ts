import { describe, expect, it } from "vitest";
import {
  addBlock,
  createBlockRegistry,
  createDocument,
  duplicateBlock,
  moveBlock,
  removeBlock,
  toggleBlockVisibility,
  updateBlock,
} from "../src";
import { containerBlock, heroBlock } from "./fixtures";

describe("operations/addBlock", () => {
  it("appends a block built from a definition", () => {
    const doc = addBlock(createDocument(), heroBlock);
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0]?.type).toBe("hero");
    expect(doc.blocks[0]?.content).toEqual({ title: "", text: "" });
  });

  it("inserts at a given index", () => {
    let doc = addBlock(createDocument(), heroBlock);
    const firstId = doc.blocks[0]?.id;
    doc = addBlock(doc, containerBlock, { index: 0 });
    expect(doc.blocks[0]?.type).toBe("container");
    expect(doc.blocks[1]?.id).toBe(firstId);
  });

  it("nests a block under a parent", () => {
    let doc = addBlock(createDocument(), containerBlock);
    const parentId = doc.blocks[0]!.id;
    doc = addBlock(doc, heroBlock, { parentId });
    expect(doc.blocks[0]?.children).toHaveLength(1);
    expect(doc.blocks[0]?.children?.[0]?.type).toBe("hero");
  });

  it("throws when the parent is unknown", () => {
    expect(() => addBlock(createDocument(), heroBlock, { parentId: "nope" })).toThrow(/not found/);
  });

  it("resolves a block type string through the registry", () => {
    const registry = createBlockRegistry([heroBlock]);
    const doc = addBlock(createDocument(), "hero", {}, registry);
    expect(doc.blocks[0]?.type).toBe("hero");
  });

  it("throws for an unregistered block type string", () => {
    const registry = createBlockRegistry();
    expect(() => addBlock(createDocument(), "ghost", {}, registry)).toThrow(/not registered/);
  });

  it("does not mutate the source document", () => {
    const doc = createDocument();
    addBlock(doc, heroBlock);
    expect(doc.blocks).toHaveLength(0);
  });
});

describe("operations/updateBlock", () => {
  it("merges a patch immutably", () => {
    const base = addBlock(createDocument(), heroBlock);
    const id = base.blocks[0]!.id;
    const updated = updateBlock(base, id, { content: { title: "Hi", text: "" } });

    expect(updated.blocks[0]?.content).toEqual({ title: "Hi", text: "" });
    expect(base.blocks[0]?.content).toEqual({ title: "", text: "" });
  });

  it("returns the document untouched when the id is unknown", () => {
    const base = addBlock(createDocument(), heroBlock);
    expect(updateBlock(base, "missing", { content: {} })).toBe(base);
  });
});

describe("operations/removeBlock", () => {
  it("removes a block", () => {
    const base = addBlock(createDocument(), heroBlock);
    const removed = removeBlock(base, base.blocks[0]!.id);
    expect(removed.blocks).toHaveLength(0);
  });

  it("returns the document untouched when the id is unknown", () => {
    const base = addBlock(createDocument(), heroBlock);
    expect(removeBlock(base, "missing")).toBe(base);
  });
});

describe("operations/duplicateBlock", () => {
  it("inserts a clone right after the original with a fresh id", () => {
    const base = addBlock(createDocument(), heroBlock);
    const sourceId = base.blocks[0]!.id;
    const doc = duplicateBlock(base, sourceId);

    expect(doc.blocks).toHaveLength(2);
    expect(doc.blocks[1]?.id).not.toBe(sourceId);
    expect(doc.blocks[1]?.content).toEqual(doc.blocks[0]?.content);
  });

  it("duplicates a nested block within its parent", () => {
    let doc = addBlock(createDocument(), containerBlock);
    const parentId = doc.blocks[0]!.id;
    doc = addBlock(doc, heroBlock, { parentId });
    const childId = doc.blocks[0]!.children![0]!.id;

    doc = duplicateBlock(doc, childId);
    expect(doc.blocks[0]?.children).toHaveLength(2);
    expect(doc.blocks[0]?.children?.[1]?.id).not.toBe(childId);
  });
});

describe("operations/toggleBlockVisibility", () => {
  it("flips visibility from the implicit true", () => {
    const base = addBlock(createDocument(), heroBlock);
    const id = base.blocks[0]!.id;
    const hidden = toggleBlockVisibility(base, id);
    const shown = toggleBlockVisibility(hidden, id);

    expect(hidden.blocks[0]?.visible).toBe(false);
    expect(shown.blocks[0]?.visible).toBe(true);
  });
});

describe("operations/moveBlock", () => {
  it("reorders top-level blocks while preserving identity", () => {
    let doc = addBlock(createDocument(), heroBlock);
    doc = addBlock(doc, containerBlock);
    const containerId = doc.blocks[1]!.id;

    const moved = moveBlock(doc, containerId, { index: 0 });
    expect(moved.blocks[0]?.id).toBe(containerId);
    expect(moved.blocks[0]?.type).toBe("container");
  });

  it("moves a block into a parent and keeps its id", () => {
    let doc = addBlock(createDocument(), containerBlock);
    doc = addBlock(doc, heroBlock);
    const parentId = doc.blocks[0]!.id;
    const heroId = doc.blocks[1]!.id;

    const moved = moveBlock(doc, heroId, { parentId, index: 0 });
    expect(moved.blocks).toHaveLength(1);
    expect(moved.blocks[0]?.children?.[0]?.id).toBe(heroId);
  });

  it("throws when the target parent does not exist", () => {
    const doc = addBlock(createDocument(), heroBlock);
    expect(() => moveBlock(doc, doc.blocks[0]!.id, { parentId: "ghost", index: 0 })).toThrow(/not found/);
  });

  it("returns the document untouched when the block is unknown", () => {
    const doc = addBlock(createDocument(), heroBlock);
    expect(moveBlock(doc, "missing", { index: 0 })).toBe(doc);
  });
});
