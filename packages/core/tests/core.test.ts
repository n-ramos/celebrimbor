import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  addBlock,
  createBlockRegistry,
  createDocument,
  defineBlock,
  duplicateBlock,
  moveBlock,
  removeBlock,
  serializePortableDocument,
  deserializePortableDocument,
  toggleBlockVisibility,
  updateBlock,
  validateDocument,
} from "../src";

const heroBlock = defineBlock({
  type: "hero",
  label: "Hero",
  category: "Marketing",
  defaultContent: {
    title: "",
    text: "",
  },
  defaultSettings: {
    alignment: "left",
  },
  schema: {
    zodSchema: z.object({
      title: z.string().min(1),
      text: z.string(),
    }),
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
    ],
  },
  settingsSchema: {
    fields: [
      {
        name: "alignment",
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
        ],
      },
    ],
  },
});

describe("@n-ramos/core", () => {
  it("registers blocks and creates a document", () => {
    const registry = createBlockRegistry([heroBlock]);
    const document = addBlock(createDocument(), heroBlock);

    expect(registry.has("hero")).toBe(true);
    expect(document.blocks).toHaveLength(1);
    expect(document.blocks[0]?.type).toBe("hero");
  });

  it("updates, duplicates, moves and removes blocks immutably", () => {
    const base = addBlock(createDocument(), heroBlock);
    const sourceBlock = base.blocks[0];
    if (!sourceBlock) {
      throw new Error("Expected a source block.");
    }

    const updated = updateBlock(base, sourceBlock.id, {
      content: {
        title: "Hello",
        text: "World",
      },
    });
    const duplicated = duplicateBlock(updated, sourceBlock.id);
    const moved = moveBlock(duplicated, duplicated.blocks[1]!.id, { index: 0 });
    const removed = removeBlock(moved, sourceBlock.id);

    expect(base.blocks[0]?.content).toEqual({ title: "", text: "" });
    expect(updated.blocks[0]?.content).toEqual({ title: "Hello", text: "World" });
    expect(duplicated.blocks).toHaveLength(2);
    expect(moved.blocks[0]?.id).not.toBe(sourceBlock.id);
    expect(removed.blocks).toHaveLength(1);
  });

  it("toggles visibility and validates documents", () => {
    const registry = createBlockRegistry([heroBlock]);
    const document = addBlock(createDocument(), heroBlock);
    const sourceBlock = document.blocks[0];
    if (!sourceBlock) {
      throw new Error("Expected a source block.");
    }

    const hidden = toggleBlockVisibility(document, sourceBlock.id);
    const invalid = updateBlock(hidden, sourceBlock.id, {
      content: { title: "", text: "" },
      settings: { alignment: "unsupported" },
    });
    const result = validateDocument(invalid, registry);

    expect(hidden.blocks[0]?.visible).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("serializes and deserializes a portable agnostic block JSON format", () => {
    const document = addBlock(createDocument({ id: "landing", title: "Landing" }), heroBlock);
    const sourceBlock = document.blocks[0];
    if (!sourceBlock) {
      throw new Error("Expected a source block.");
    }

    const updated = updateBlock(document, sourceBlock.id, {
      content: { title: "Hero title", text: "Hero text" },
      settings: { alignment: "center" },
    });

    const portable = serializePortableDocument(updated);
    const roundtrip = deserializePortableDocument(portable, {
      id: updated.id,
      title: updated.title,
      version: updated.version,
    });

    expect(portable).toEqual([
      {
        _id: updated.blocks[0]?.id,
        _name: "hero",
        _settings: { alignment: "center" },
        _visible: true,
        text: "Hero text",
        title: "Hero title",
      },
    ]);
    expect(roundtrip.blocks[0]?.type).toBe("hero");
    expect(roundtrip.blocks[0]?.content).toEqual({ title: "Hero title", text: "Hero text" });
    expect(roundtrip.blocks[0]?.settings).toEqual({ alignment: "center" });
  });
});
