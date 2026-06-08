import { describe, expect, it } from "vitest";
import {
  deserializeDocument,
  deserializePortableDocument,
  serializeDocument,
  serializePortableDocument,
  type PageDocument,
  type PortableBlock,
} from "../src";

const document: PageDocument = {
  version: "1.0.0",
  id: "landing",
  title: "Landing",
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      content: { title: "Title", text: "Text" },
      settings: { alignment: "center" },
      visible: true,
      children: [
        { id: "child-1", type: "rich-text", content: { html: "<p>Hi</p>" } },
      ],
    },
  ],
};

describe("serialize/document JSON", () => {
  it("round-trips through pretty JSON", () => {
    const restored = deserializeDocument(serializeDocument(document));
    expect(restored).toEqual(document);
  });
});

describe("serialize/portable format", () => {
  it("flattens content next to reserved underscore keys", () => {
    const [hero] = serializePortableDocument(document);
    expect(hero).toMatchObject({
      _id: "hero-1",
      _name: "hero",
      _settings: { alignment: "center" },
      _visible: true,
      title: "Title",
      text: "Text",
    });
    expect(hero?._children?.[0]).toMatchObject({ _name: "rich-text", html: "<p>Hi</p>" });
  });

  it("omits empty settings", () => {
    const doc: PageDocument = {
      version: "1.0.0",
      blocks: [{ id: "1", type: "x", content: { a: 1 }, settings: {} }],
    };
    expect(serializePortableDocument(doc)[0]).not.toHaveProperty("_settings");
  });

  it("round-trips a portable document back to the internal model", () => {
    const portable = serializePortableDocument(document);
    const restored = deserializePortableDocument(portable, {
      id: document.id,
      title: document.title,
      version: document.version,
    });
    expect(restored.blocks[0]?.type).toBe("hero");
    expect(restored.blocks[0]?.content).toEqual({ title: "Title", text: "Text" });
    expect(restored.blocks[0]?.children?.[0]?.type).toBe("rich-text");
  });

  it("generates an id when the portable block has none", () => {
    const portable: PortableBlock[] = [{ _name: "hero", title: "T" }];
    const restored = deserializePortableDocument(portable);
    expect(restored.blocks[0]?.id).toBeTypeOf("string");
    expect(restored.blocks[0]?.content).toEqual({ title: "T" });
  });

  it("escapes content keys that collide with reserved keys (no data loss)", () => {
    const doc: PageDocument = {
      version: "1.0.0",
      blocks: [{ id: "1", type: "hero", content: { _name: "collision", title: "ok" } }],
    };
    const [portable] = serializePortableDocument(doc);

    // The block type stays intact under `_name`; the colliding content key is
    // escaped by doubling its leading underscore.
    expect(portable?._name).toBe("hero");
    expect(portable?.__name).toBe("collision");
    expect(portable?.title).toBe("ok");
  });

  it("round-trips a document whose content uses reserved-looking keys", () => {
    const doc: PageDocument = {
      version: "1.0.0",
      blocks: [
        {
          id: "1",
          type: "hero",
          content: { _name: "x", _settings: "y", _visible: "z", plain: "p" },
        },
      ],
    };
    const restored = deserializePortableDocument(serializePortableDocument(doc), { version: "1.0.0" });
    expect(restored.blocks[0]?.content).toEqual({ _name: "x", _settings: "y", _visible: "z", plain: "p" });
    expect(restored.blocks[0]?.type).toBe("hero");
  });
});
