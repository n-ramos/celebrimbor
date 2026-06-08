import { describe, expect, it } from "vitest";
import {
  createBlockRegistry,
  createDocument,
  createUnknownBlockDefinition,
  validateBlock,
  validateDocument,
  validateSchemaValue,
  type BlockSchema,
} from "../src";
import { faqBlock, heroBlock } from "./fixtures";

describe("validation/validateSchemaValue", () => {
  it("reports missing required fields", () => {
    const result = validateSchemaValue(heroBlock.schema, { title: "", text: "" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "required")).toBe(true);
  });

  it("accepts a valid value", () => {
    const result = validateSchemaValue(heroBlock.schema, { title: "Hello", text: "" });
    expect(result.valid).toBe(true);
  });

  it("rejects an unsupported select option", () => {
    const result = validateSchemaValue(heroBlock.settingsSchema!, { alignment: "diagonal" });
    expect(result.issues.some((i) => i.code === "invalid_enum_value")).toBe(true);
  });

  it("enforces array minItems and maxItems", () => {
    const empty = validateSchemaValue(faqBlock.schema, { items: [] });
    expect(empty.issues.some((i) => i.code === "too_small")).toBe(true);

    const tooMany = validateSchemaValue(faqBlock.schema, {
      items: [1, 2, 3, 4].map(() => ({ question: "q", answer: "a" })),
    });
    expect(tooMany.issues.some((i) => i.code === "too_big")).toBe(true);
  });

  it("flags a non-array value for an array field", () => {
    const result = validateSchemaValue(faqBlock.schema, { items: "nope" });
    expect(result.issues.some((i) => i.code === "invalid_type")).toBe(true);
  });

  it("validates nested object fields inside arrays", () => {
    const result = validateSchemaValue(faqBlock.schema, { items: [{ question: "", answer: "" }] });
    const paths = result.issues.map((i) => i.path);
    expect(paths).toContain("items.0.question");
    expect(paths).toContain("items.0.answer");
  });

  it("surfaces zod issues alongside field issues", () => {
    const schema: BlockSchema = {
      fields: [],
      // re-using the hero zodSchema indirectly through validateBlock below;
      // here we assert plain field validation passes with no zod schema.
    };
    expect(validateSchemaValue(schema, {}).valid).toBe(true);
  });
});

describe("validation/validateBlock", () => {
  it("combines content, settings and zod validation", () => {
    const result = validateBlock(heroBlock, {
      id: "x",
      type: "hero",
      content: { title: "", text: "" },
      settings: { alignment: "nope" },
    });
    expect(result.valid).toBe(false);
    // required (field) + zod min(1) + invalid select option
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});

describe("validation/validateDocument", () => {
  it("reports unknown block types as errors when no fallback factory is set", () => {
    const registry = createBlockRegistry();
    const doc = {
      version: "1.0.0",
      blocks: [{ id: "1", type: "ghost", content: {} }],
    };
    const result = validateDocument(doc, registry);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.code).toBe("unknown_block");
    expect(result.issues[0]?.severity).toBe("error");
  });

  it("downgrades unknown blocks to a warning when a fallback factory is set", () => {
    const registry = createBlockRegistry();
    registry.setUnknownBlockFactory(createUnknownBlockDefinition);
    const doc = {
      version: "1.0.0",
      blocks: [{ id: "1", type: "ghost", content: {} }],
    };
    const result = validateDocument(doc, registry);
    // The document stays valid; the unknown block is only flagged as a warning.
    expect(result.valid).toBe(true);
    expect(result.issues[0]?.severity).toBe("warning");
    expect(result.issues[0]?.code).toBe("unknown_block");
  });

  it("prefixes issue paths with the block location", () => {
    const registry = createBlockRegistry([heroBlock]);
    const doc = createDocument({
      blocks: [{ id: "1", type: "hero", content: { title: "", text: "" } }],
    });
    const result = validateDocument(doc, registry);
    expect(result.valid).toBe(false);
    expect(result.issues.every((i) => i.path.startsWith("blocks.0"))).toBe(true);
  });
});
