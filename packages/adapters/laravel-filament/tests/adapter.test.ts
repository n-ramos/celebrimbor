import { describe, expect, it, vi } from "vitest";
import type { PageDocument } from "@n-ramos/core";
import { createLaravelAssetPicker, mountFilamentBridge } from "../src";

describe("laravel asset picker", () => {
  it("maps a media payload to an Asset", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "42", url: "/media/42.jpg", alt: "Photo", width: 800, height: 600 }),
    } as Response);

    const picker = createLaravelAssetPicker({ endpoint: "/media/pick", fetcher });
    const asset = await picker.pickAsset();
    expect(asset).toEqual({ id: "42", url: "/media/42.jpg", alt: "Photo", width: 800, height: 600 });
  });

  it("returns null when the picker yields no payload", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => null } as Response);
    const picker = createLaravelAssetPicker({ endpoint: "/media/pick", fetcher });
    expect(await picker.pickAsset()).toBeNull();
  });

  it("throws when the endpoint responds with an error", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false } as Response);
    const picker = createLaravelAssetPicker({ endpoint: "/media/pick", fetcher });
    await expect(picker.pickAsset()).rejects.toThrow(/Unable to load/);
  });
});

describe("filament bridge", () => {
  const doc: PageDocument = { version: "1.0.0", id: "page", blocks: [] };

  it("dispatches a mounted event exposing the channel", () => {
    const element = document.createElement("div");
    const onChange = vi.fn();
    const detailSpy = vi.fn();
    element.addEventListener("my-page-builder:mounted", (event) => {
      detailSpy((event as CustomEvent).detail);
    });

    const channel = mountFilamentBridge({ element, initialValue: doc, onChange });
    expect(detailSpy).toHaveBeenCalledWith(channel);
    expect(channel.getValue()).toEqual(doc);
  });

  it("routes setValue to onChange and save to onSave", async () => {
    const element = document.createElement("div");
    const onChange = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const channel = mountFilamentBridge({ element, initialValue: doc, onChange, onSave });

    const next: PageDocument = { ...doc, title: "Updated" };
    channel.setValue(next);
    await channel.save(next);

    expect(onChange).toHaveBeenCalledWith(next);
    expect(onSave).toHaveBeenCalledWith(next);
  });
});
