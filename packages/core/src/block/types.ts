import type { PageBlock } from "../document/types";
import type { BlockSchema } from "../schema/types";
import type { ValidationResult } from "../validation/types";

export type RenderNode<TContent = unknown, TSettings = unknown> = {
  block: PageBlock<TContent, TSettings>;
  children: RenderNode[];
};

type BivariantCallback<TArgs extends unknown[], TResult> = {
  bivarianceHack: (...args: TArgs) => TResult;
}["bivarianceHack"];

export type BlockRenderer<TContent = unknown, TSettings = unknown, TOutput = unknown> = BivariantCallback<
  [node: RenderNode<TContent, TSettings>],
  TOutput
>;

export type BlockDefinition<TContent = any, TSettings = any> = {
  type: string;
  label: string;
  category?: string | undefined;
  icon?: string | undefined;
  defaultContent: TContent;
  defaultSettings?: TSettings | undefined;
  schema: BlockSchema<TContent>;
  settingsSchema?: BlockSchema<TSettings> | undefined;
  validate?: BivariantCallback<[content: TContent, settings?: TSettings], ValidationResult>;
  render?: BlockRenderer<TContent, TSettings>;
  /**
   * Rendu HTML headless optionnel (string), utilise par `renderDocumentToHtml`.
   * Permet un rendu cote serveur sans dependance React/DOM.
   */
  renderHtml?: BivariantCallback<
    [context: { block: PageBlock<TContent, TSettings>; childrenHtml: string }],
    string
  >;
  supportsChildren?: boolean | undefined;
  tags?: string[] | undefined;
};

export type AnyBlockDefinition = BlockDefinition<any, any>;

export type LazyBlockLoader = () => Promise<AnyBlockDefinition>;

export type UnknownBlockDefinition = AnyBlockDefinition & {
  unknown: true;
};
