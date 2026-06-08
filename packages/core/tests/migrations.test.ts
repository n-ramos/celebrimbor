import { describe, expect, it } from "vitest";
import { createDocument, migrateDocument, type DocumentMigration } from "../src";

const chain: DocumentMigration[] = [
  { from: "1.0.0", to: "1.1.0", migrate: (d) => ({ ...d, version: "1.1.0", title: "v1.1" }) },
  { from: "1.1.0", to: "2.0.0", migrate: (d) => ({ ...d, version: "2.0.0", title: "v2" }) },
];

describe("migrations/migrateDocument", () => {
  it("applies the full chain in order", () => {
    const result = migrateDocument(createDocument({ version: "1.0.0" }), chain);
    expect(result.version).toBe("2.0.0");
    expect(result.title).toBe("v2");
  });

  it("starts from the matching intermediate version", () => {
    const result = migrateDocument(createDocument({ version: "1.1.0" }), chain);
    expect(result.version).toBe("2.0.0");
  });

  it("stops when no migration matches the current version", () => {
    const result = migrateDocument(createDocument({ version: "9.9.9" }), chain);
    expect(result.version).toBe("9.9.9");
  });

  it("does not mutate the input document", () => {
    const input = createDocument({ version: "1.0.0" });
    migrateDocument(input, chain);
    expect(input.version).toBe("1.0.0");
  });
});
