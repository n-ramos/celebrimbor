import { describe, expect, it } from "vitest";
import type { PageBlock } from "../src";
import {
  findBlock,
  insertBlockAtPath,
  mapBlocks,
  removeBlockAtPath,
  updateBlocksAtPath,
} from "../src";

function block(id: string, children: PageBlock[] = []): PageBlock {
  return { id, type: "test", content: {}, children };
}

function tree() {
  return {
    version: "1.0.0",
    blocks: [
      block("a"),
      block("b", [block("b1"), block("b2", [block("b2a")])]),
    ],
  };
}

describe("tree/findBlock", () => {
  it("locates a top-level block with its path", () => {
    const location = findBlock(tree(), "b");
    expect(location?.path).toEqual([1]);
    expect(location?.parent).toBeNull();
  });

  it("locates a deeply nested block with parent and path", () => {
    const location = findBlock(tree(), "b2a");
    expect(location?.path).toEqual([1, 1, 0]);
    expect(location?.parent?.id).toBe("b2");
  });

  it("returns null when the block does not exist", () => {
    expect(findBlock(tree(), "missing")).toBeNull();
  });
});

describe("tree/updateBlocksAtPath", () => {
  it("updates a nested block immutably", () => {
    const original = tree().blocks;
    const updated = updateBlocksAtPath(original, [1, 1], (b) => ({ ...b, type: "patched" }));

    expect(updated[1]?.children?.[1]?.type).toBe("patched");
    expect(original[1]?.children?.[1]?.type).toBe("test");
    expect(updated).not.toBe(original);
  });

  it("returns the same collection for an empty path", () => {
    const original = tree().blocks;
    expect(updateBlocksAtPath(original, [], (b) => b)).toBe(original);
  });
});

describe("tree/removeBlockAtPath", () => {
  it("removes a nested block", () => {
    const updated = removeBlockAtPath(tree().blocks, [1, 0]);
    expect(updated[1]?.children?.map((c) => c.id)).toEqual(["b2"]);
  });

  it("removes a top-level block", () => {
    const updated = removeBlockAtPath(tree().blocks, [0]);
    expect(updated.map((b) => b.id)).toEqual(["b"]);
  });
});

describe("tree/insertBlockAtPath", () => {
  it("appends when the path is empty", () => {
    const updated = insertBlockAtPath(tree().blocks, [], block("z"));
    expect(updated.at(-1)?.id).toBe("z");
  });

  it("inserts inside a nested children list", () => {
    const updated = insertBlockAtPath(tree().blocks, [1, 0], block("inserted"));
    expect(updated[1]?.children?.map((c) => c.id)).toEqual(["inserted", "b1", "b2"]);
  });
});

describe("tree/mapBlocks", () => {
  it("applies the iteratee recursively", () => {
    const mapped = mapBlocks(tree().blocks, (b) => ({ ...b, type: `${b.type}!` }));
    expect(mapped[1]?.type).toBe("test!");
    expect(mapped[1]?.children?.[1]?.children?.[0]?.type).toBe("test!");
  });
});
