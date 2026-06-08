import { describe, expect, it } from "vitest";
import { createDocument, createHistory, pushHistory, redoHistory, undoHistory } from "../src";

const docA = createDocument({ id: "a" });
const docB = createDocument({ id: "b" });
const docC = createDocument({ id: "c" });

describe("history", () => {
  it("starts with an isolated present", () => {
    const state = createHistory(docA);
    expect(state.present.id).toBe("a");
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.present).not.toBe(docA);
  });

  it("pushes the previous present into the past and clears the future", () => {
    let state = createHistory(docA);
    state = pushHistory(state, docB);
    expect(state.present.id).toBe("b");
    expect(state.past.map((d) => d.id)).toEqual(["a"]);
    expect(state.future).toEqual([]);
  });

  it("undoes and redoes across the timeline", () => {
    let state = createHistory(docA);
    state = pushHistory(state, docB);
    state = pushHistory(state, docC);

    state = undoHistory(state);
    expect(state.present.id).toBe("b");
    expect(state.future.map((d) => d.id)).toEqual(["c"]);

    state = redoHistory(state);
    expect(state.present.id).toBe("c");
    expect(state.future).toEqual([]);
  });

  it("is a no-op when there is nothing to undo or redo", () => {
    const state = createHistory(docA);
    expect(undoHistory(state)).toBe(state);
    expect(redoHistory(state)).toBe(state);
  });

  it("enforces the history limit", () => {
    let state = createHistory(docA, 2);
    state = pushHistory(state, docB);
    state = pushHistory(state, docC);
    state = pushHistory(state, createDocument({ id: "d" }));
    expect(state.past).toHaveLength(2);
    expect(state.past.map((d) => d.id)).toEqual(["b", "c"]);
  });
});
