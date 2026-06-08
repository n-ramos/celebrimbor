import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDocument, defineBlock, type PageDocument } from "@n-ramos/celebrimbor-core";
import { usePageBuilder } from "../src";

const heroDef = defineBlock({
  type: "hero",
  label: "Hero",
  defaultContent: { title: "" },
  schema: { fields: [{ name: "title", type: "text", label: "Title" }] },
});

/**
 * Harnais "controle" : l'appelant detient le document et le met a jour quand
 * le hook emet `onChange`, comme le ferait `PageBuilder`.
 */
function setup(initial: PageDocument = createDocument()) {
  const state = { doc: initial };
  const onChange = vi.fn((next: PageDocument) => {
    state.doc = next;
  });
  const onSave = vi.fn().mockResolvedValue(undefined);
  const view = renderHook(() => usePageBuilder({ document: state.doc, onChange, onSave }));
  return { state, onChange, onSave, ...view };
}

describe("usePageBuilder", () => {
  it("adds a block and selects it", () => {
    const { result, rerender, state, onChange } = setup();
    act(() => result.current.add(heroDef));
    rerender();

    expect(onChange).toHaveBeenCalledOnce();
    expect(state.doc.blocks).toHaveLength(1);
    expect(result.current.selectedId).toBe(state.doc.blocks[0]?.id);
    expect(result.current.selectedBlock?.type).toBe("hero");
  });

  it("inserts a block at a given index", () => {
    const { result, rerender, state } = setup();
    act(() => result.current.add(heroDef));
    rerender();
    act(() => result.current.insert(heroDef, 0));
    rerender();

    expect(state.doc.blocks).toHaveLength(2);
    expect(result.current.selectedId).toBe(state.doc.blocks[0]?.id);
  });

  it("updates content through the core operation", () => {
    const { result, rerender, state } = setup();
    act(() => result.current.add(heroDef));
    rerender();
    const id = state.doc.blocks[0]!.id;
    act(() => result.current.updateContent(id, { title: "Hello" }));

    expect(state.doc.blocks[0]?.content).toEqual({ title: "Hello" });
  });

  it("clears selection when the selected block is removed", () => {
    const { result, rerender, state } = setup();
    act(() => result.current.add(heroDef));
    rerender();
    const id = state.doc.blocks[0]!.id;
    act(() => result.current.remove(id));
    rerender();

    expect(state.doc.blocks).toHaveLength(0);
    expect(result.current.selectedId).toBeUndefined();
  });

  it("duplicates a block", () => {
    const { result, rerender, state } = setup();
    act(() => result.current.add(heroDef));
    rerender();
    act(() => result.current.duplicate(state.doc.blocks[0]!.id));
    rerender();

    expect(state.doc.blocks).toHaveLength(2);
  });

  it("toggles saving state around onSave", async () => {
    const { result, onSave } = setup();
    await act(async () => {
      await result.current.save();
    });
    expect(onSave).toHaveBeenCalledOnce();
    expect(result.current.saving).toBe(false);
  });

  it("respects controlled selection (does not mutate internal state)", () => {
    const onChange = vi.fn();
    const onSelectBlock = vi.fn();
    const { result } = renderHook(() =>
      usePageBuilder({
        document: createDocument(),
        onChange,
        selectedBlockId: "external",
        onSelectBlock,
      }),
    );

    act(() => result.current.selectBlock("other"));
    // In controlled mode the hook reports the prop and delegates the choice.
    expect(result.current.selectedId).toBe("external");
    expect(onSelectBlock).toHaveBeenCalledWith("other");
  });
});
