export type PageBuilderEventMap = {
  "document:changed": { documentId?: string };
  "document:saved": { documentId?: string };
  "block:selected": { blockId?: string };
  "block:updated": { blockId: string };
};

type EventListener<TPayload> = (payload: TPayload) => void;

export function createEventBus<TEvents extends Record<string, unknown>>() {
  const listeners = new Map<keyof TEvents, Set<EventListener<any>>>();

  return {
    on<TKey extends keyof TEvents>(type: TKey, listener: EventListener<TEvents[TKey]>) {
      const bucket = listeners.get(type) ?? new Set();
      bucket.add(listener);
      listeners.set(type, bucket);

      return () => {
        bucket.delete(listener);
      };
    },
    emit<TKey extends keyof TEvents>(type: TKey, payload: TEvents[TKey]) {
      listeners.get(type)?.forEach((listener) => listener(payload));
    },
    clear() {
      listeners.clear();
    },
  };
}
