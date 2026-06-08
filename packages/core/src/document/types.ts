export type PageBlock<TContent = Record<string, unknown>, TSettings = Record<string, unknown>> = {
  id: string;
  type: string;
  content: TContent;
  settings?: TSettings | undefined;
  children?: PageBlock[] | undefined;
  visible?: boolean | undefined;
};

export type PageDocument = {
  version: string;
  id?: string | undefined;
  title?: string | undefined;
  blocks: PageBlock[];
  meta?: Record<string, unknown> | undefined;
};

export type BlockInsertPosition = {
  parentId?: string | undefined;
  index?: number | undefined;
};

export type BlockTargetPosition = {
  parentId?: string | undefined;
  index: number;
};

export type BlockMovePosition = BlockTargetPosition;
