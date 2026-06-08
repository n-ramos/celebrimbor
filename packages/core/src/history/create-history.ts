import type { PageDocument } from "../document/types";

export type HistoryState = {
  past: PageDocument[];
  present: PageDocument;
  future: PageDocument[];
  limit: number;
};

export function createHistory(initialDocument: PageDocument, limit = 50): HistoryState {
  return {
    past: [],
    present: structuredClone(initialDocument),
    future: [],
    limit,
  };
}

export function pushHistory(state: HistoryState, nextDocument: PageDocument): HistoryState {
  const past = [...state.past, structuredClone(state.present)].slice(-state.limit);
  return {
    ...state,
    past,
    present: structuredClone(nextDocument),
    future: [],
  };
}

export function undoHistory(state: HistoryState): HistoryState {
  const previous = state.past.at(-1);
  if (!previous) {
    return state;
  }

  return {
    ...state,
    past: state.past.slice(0, -1),
    present: previous,
    future: [structuredClone(state.present), ...state.future],
  };
}

export function redoHistory(state: HistoryState): HistoryState {
  const next = state.future[0];
  if (!next) {
    return state;
  }

  return {
    ...state,
    past: [...state.past, structuredClone(state.present)].slice(-state.limit),
    present: next,
    future: state.future.slice(1),
  };
}
