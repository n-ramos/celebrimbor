import { describe, expect, it, vi } from "vitest";
import type { PageDocument } from "@n-ramos/core";
import { createRestStorage } from "../src";

function jsonResponse(body: unknown, init: Partial<{ ok: boolean; status: number }> = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as Response;
}

const doc: PageDocument = { version: "1.0.0", id: "home", blocks: [] };

describe("rest adapter", () => {
  it("loads a document by id with resolved headers", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(doc));
    const storage = createRestStorage({
      baseUrl: "https://api.test/pages",
      headers: async () => ({ Authorization: "Bearer t" }),
      fetcher,
    });

    const result = await storage.load("home");
    expect(result).toEqual(doc);
    expect(fetcher).toHaveBeenCalledWith("https://api.test/pages/home", {
      method: "GET",
      headers: { Authorization: "Bearer t" },
    });
  });

  it("PUTs an existing document and POSTs a new one", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({}));
    const storage = createRestStorage({ baseUrl: "https://api.test/pages", fetcher });

    await storage.save(doc);
    expect(fetcher).toHaveBeenLastCalledWith(
      "https://api.test/pages/home",
      expect.objectContaining({ method: "PUT" }),
    );

    await storage.save({ version: "1.0.0", blocks: [] });
    expect(fetcher).toHaveBeenLastCalledWith(
      "https://api.test/pages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws on a non-ok response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 503 }));
    const storage = createRestStorage({ baseUrl: "https://api.test/pages", fetcher });
    await expect(storage.load("home")).rejects.toThrow(/status 503/);
  });

  it("refuses to publish a document without an id", async () => {
    const fetcher = vi.fn();
    const storage = createRestStorage({ baseUrl: "https://api.test/pages", fetcher });
    await expect(storage.publish!({ version: "1.0.0", blocks: [] })).rejects.toThrow(/without an id/);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns the preview url from the response payload", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ url: "https://preview.test/x" }));
    const storage = createRestStorage({ baseUrl: "https://api.test/pages", fetcher });
    expect(await storage.preview!(doc)).toBe("https://preview.test/x");
  });
});
