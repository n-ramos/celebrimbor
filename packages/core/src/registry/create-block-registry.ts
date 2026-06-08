import type { AnyBlockDefinition, LazyBlockLoader, UnknownBlockDefinition } from "../block/types";
import { createBlockFromDefinition } from "../document/factories";
import type { PageBlock } from "../document/types";

export type BlockRegistry = ReturnType<typeof createBlockRegistry>;

export function createBlockRegistry(initialDefinitions: AnyBlockDefinition[] = []) {
  const definitions = new Map<string, AnyBlockDefinition>();
  const loaders = new Map<string, LazyBlockLoader>();
  let unknownFactory: ((type: string) => UnknownBlockDefinition) | undefined;

  const api = {
    register(definition: AnyBlockDefinition) {
      if (definitions.has(definition.type) || loaders.has(definition.type)) {
        throw new Error(`Block type "${definition.type}" is already registered.`);
      }

      definitions.set(definition.type, definition);
      return api;
    },
    unregister(type: string) {
      definitions.delete(type);
      loaders.delete(type);
      return api;
    },
    registerLazy(type: string, loader: LazyBlockLoader) {
      if (definitions.has(type) || loaders.has(type)) {
        throw new Error(`Block type "${type}" is already registered.`);
      }

      loaders.set(type, loader);
      return api;
    },
    async resolve(type: string) {
      const existing = definitions.get(type);
      if (existing) {
        return existing;
      }

      const loader = loaders.get(type);
      if (!loader) {
        return unknownFactory?.(type);
      }

      const resolved = await loader();
      definitions.set(type, resolved);
      loaders.delete(type);
      return resolved;
    },
    get(type: string) {
      return definitions.get(type) ?? unknownFactory?.(type);
    },
    has(type: string) {
      return definitions.has(type) || loaders.has(type);
    },
    all() {
      return [...definitions.values()];
    },
    byCategory() {
      return api.all().reduce<Record<string, AnyBlockDefinition[]>>((accumulator, definition) => {
        const category = definition.category ?? "General";
        accumulator[category] ??= [];
        accumulator[category].push(definition);
        return accumulator;
      }, {});
    },
    createBlock(type: string, overrides?: Partial<PageBlock>) {
      const definition = definitions.get(type) ?? unknownFactory?.(type);
      if (!definition) {
        throw new Error(`Block type "${type}" is not registered.`);
      }

      return createBlockFromDefinition(definition, overrides);
    },
    setUnknownBlockFactory(factory: (type: string) => UnknownBlockDefinition) {
      unknownFactory = factory;
      return api;
    },
  };

  for (const definition of initialDefinitions) {
    api.register(definition);
  }

  return api;
}

export function createUnknownBlockDefinition(type: string): UnknownBlockDefinition {
  return {
    type,
    label: `Unknown: ${type}`,
    category: "Unknown",
    defaultContent: {},
    defaultSettings: {},
    schema: { fields: [] },
    unknown: true,
  };
}
