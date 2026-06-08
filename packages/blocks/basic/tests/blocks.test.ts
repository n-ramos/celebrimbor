import { describe, expect, it } from "vitest";
import { createBlockRegistry, validateBlock } from "@n-ramos/celebrimbor-core";
import { basicBlocks, registerBasicBlocks } from "../src";

describe("blocks-basic registration", () => {
  it("registers every basic block exactly once", () => {
    const registry = registerBasicBlocks(createBlockRegistry());
    expect(registry.all()).toHaveLength(basicBlocks.length);
    for (const block of basicBlocks) {
      expect(registry.has(block.type)).toBe(true);
    }
  });

  it("is idempotent (safe to call twice)", () => {
    const registry = registerBasicBlocks(createBlockRegistry());
    expect(() => registerBasicBlocks(registry)).not.toThrow();
    expect(registry.all()).toHaveLength(basicBlocks.length);
  });

  it("exposes a unique type per block", () => {
    const types = basicBlocks.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("blocks-basic default contract", () => {
  // The shipped default content/settings of every block must satisfy its own
  // schema, otherwise a freshly inserted block would render as invalid.
  it.each(basicBlocks.map((b) => [b.type, b] as const))(
    "block %s ships with schema-valid defaults",
    (_type, definition) => {
      const result = validateBlock(definition, {
        id: "x",
        type: definition.type,
        content: definition.defaultContent as Record<string, unknown>,
        settings: definition.defaultSettings as Record<string, unknown> | undefined,
      });
      expect(result.issues).toEqual([]);
    },
  );
});
