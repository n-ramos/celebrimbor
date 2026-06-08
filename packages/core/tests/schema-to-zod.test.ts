import { describe, expect, it } from "vitest";
import { schemaToZod, withGeneratedZodSchema, type BlockField } from "../src";

const fields: BlockField[] = [
  { name: "title", type: "text", label: "Title", required: true },
  { name: "subtitle", type: "text", label: "Subtitle" },
  { name: "count", type: "number", label: "Count", required: true },
  { name: "featured", type: "boolean", label: "Featured" },
  {
    name: "alignment",
    type: "select",
    label: "Alignment",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
    ],
  },
  {
    name: "items",
    type: "array",
    label: "Items",
    minItems: 1,
    maxItems: 2,
    of: { name: "item", type: "text", label: "Item" },
  },
  {
    name: "cta",
    type: "object",
    label: "CTA",
    fields: [{ name: "label", type: "text", label: "Label", required: true }],
  },
];

describe("schemaToZod", () => {
  const zodSchema = schemaToZod(fields);

  it("accepts a fully valid value", () => {
    const result = zodSchema.safeParse({
      title: "Hello",
      count: 3,
      alignment: "left",
      items: ["a"],
      cta: { label: "Go" },
    });
    expect(result.success).toBe(true);
  });

  it("requires non-empty strings for required text fields", () => {
    expect(zodSchema.safeParse({ title: "", count: 1 }).success).toBe(false);
  });

  it("treats unmarked fields as optional", () => {
    // `subtitle` and `featured` are omitted on purpose.
    expect(zodSchema.safeParse({ title: "x", count: 1 }).success).toBe(true);
  });

  it("restricts select fields to their options", () => {
    expect(zodSchema.safeParse({ title: "x", count: 1, alignment: "diagonal" }).success).toBe(false);
  });

  it("enforces array bounds derived from minItems/maxItems", () => {
    expect(zodSchema.safeParse({ title: "x", count: 1, items: [] }).success).toBe(false);
    expect(zodSchema.safeParse({ title: "x", count: 1, items: ["a", "b", "c"] }).success).toBe(false);
  });

  it("validates nested object fields", () => {
    expect(zodSchema.safeParse({ title: "x", count: 1, cta: { label: "" } }).success).toBe(false);
  });

  it("rejects a non-number for a number field", () => {
    expect(zodSchema.safeParse({ title: "x", count: "nope" }).success).toBe(false);
  });
});

describe("ciklik-style fields", () => {
  const zodSchema = schemaToZod([
    { name: "rating", type: "range", label: "Rating", min: 0, max: 5, required: true },
    { name: "published", type: "date", label: "Published" },
    { name: "block", type: "alignment", label: "Block align" },
    { name: "text", type: "textalign", label: "Text align" },
  ]);

  it("treats range as a bounded number", () => {
    expect(zodSchema.safeParse({ rating: 3 }).success).toBe(true);
    expect(zodSchema.safeParse({ rating: 9 }).success).toBe(false);
    expect(zodSchema.safeParse({ rating: "3" }).success).toBe(false);
  });

  it("treats date as a string", () => {
    expect(zodSchema.safeParse({ rating: 1, published: "2026-06-08" }).success).toBe(true);
  });

  it("restricts alignment to its default options", () => {
    expect(zodSchema.safeParse({ rating: 1, block: "center" }).success).toBe(true);
    expect(zodSchema.safeParse({ rating: 1, block: "diagonal" }).success).toBe(false);
  });

  it("allows justify only for textalign", () => {
    expect(zodSchema.safeParse({ rating: 1, text: "justify" }).success).toBe(true);
    expect(zodSchema.safeParse({ rating: 1, block: "justify" }).success).toBe(false);
  });
});

describe("layout + custom fields", () => {
  const zodSchema = schemaToZod([
    {
      type: "tabs",
      tabs: [
        { label: "Content", fields: [{ name: "title", type: "text", label: "Title", required: true }] },
        {
          label: "Style",
          fields: [
            {
              type: "row",
              label: "Alignment",
              fields: [
                { name: "align", type: "alignment", label: "Block" },
                { name: "width", type: "range", label: "Width", min: 0, max: 100 },
              ],
            },
          ],
        },
      ],
    },
    { name: "widget", type: "custom", label: "Widget", component: "my-widget" },
  ]);

  it("flattens row/tabs children into the parent shape", () => {
    expect(zodSchema.safeParse({ title: "Hi", align: "center", width: 40 }).success).toBe(true);
    // `title` (nested in a tab) stays required at top level.
    expect(zodSchema.safeParse({ align: "center" }).success).toBe(false);
    // `align` keeps its enum constraint despite being inside a row.
    expect(zodSchema.safeParse({ title: "Hi", align: "diagonal" }).success).toBe(false);
  });

  it("accepts arbitrary values for custom fields", () => {
    expect(zodSchema.safeParse({ title: "Hi", widget: { anything: true } }).success).toBe(true);
    expect(zodSchema.safeParse({ title: "Hi" }).success).toBe(true);
  });
});

describe("withGeneratedZodSchema", () => {
  it("fills a missing zodSchema from the fields", () => {
    const schema = withGeneratedZodSchema({ fields });
    expect(schema.zodSchema).toBeDefined();
  });

  it("keeps an existing zodSchema untouched", () => {
    const existing = schemaToZod([{ name: "x", type: "text", label: "X" }]);
    const schema = withGeneratedZodSchema({ fields, zodSchema: existing });
    expect(schema.zodSchema).toBe(existing);
  });
});
