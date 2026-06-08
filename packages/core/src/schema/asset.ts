export type Asset = {
  id: string;
  url: string;
  alt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  meta?: Record<string, unknown> | undefined;
};

export type AssetPickerAdapter = {
  pickAsset: () => Promise<Asset | null>;
};
