import { describe, expect, it, vi } from "vitest";
import { createEventBus, type PageBuilderEventMap } from "../src";

describe("events/createEventBus", () => {
  it("notifies subscribers with the payload", () => {
    const bus = createEventBus<PageBuilderEventMap>();
    const listener = vi.fn();
    bus.on("block:updated", listener);

    bus.emit("block:updated", { blockId: "x" });
    expect(listener).toHaveBeenCalledWith({ blockId: "x" });
  });

  it("supports several listeners on the same event", () => {
    const bus = createEventBus<PageBuilderEventMap>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("document:saved", a);
    bus.on("document:saved", b);

    bus.emit("document:saved", { documentId: "doc" });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("stops notifying after unsubscribe", () => {
    const bus = createEventBus<PageBuilderEventMap>();
    const listener = vi.fn();
    const off = bus.on("block:selected", listener);

    off();
    bus.emit("block:selected", { blockId: "x" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears every listener", () => {
    const bus = createEventBus<PageBuilderEventMap>();
    const listener = vi.fn();
    bus.on("document:changed", listener);

    bus.clear();
    bus.emit("document:changed", {});
    expect(listener).not.toHaveBeenCalled();
  });

  it("does nothing when emitting an event without listeners", () => {
    const bus = createEventBus<PageBuilderEventMap>();
    expect(() => bus.emit("document:changed", {})).not.toThrow();
  });
});
