import type { AssetPickerAdapter, PageDocument } from "@n-ramos/core";

export type LaravelMediaPayload = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type CreateLaravelAssetPickerOptions = {
  endpoint: string;
  headers?: HeadersInit | (() => Promise<HeadersInit> | HeadersInit);
  fetcher?: typeof fetch;
};

export type MountFilamentBuilderOptions = {
  element: HTMLElement;
  initialValue: PageDocument;
  onChange: (document: PageDocument) => void;
  onSave?: (document: PageDocument) => Promise<void>;
};

export function createLaravelAssetPicker(
  options: CreateLaravelAssetPickerOptions,
): AssetPickerAdapter {
  const fetcher = options.fetcher ?? fetch;

  return {
    async pickAsset() {
      const response = await fetcher(options.endpoint, {
        method: "GET",
        headers: await resolveHeaders(options.headers),
      });

      if (!response.ok) {
        throw new Error(`Unable to load Laravel asset picker from ${options.endpoint}.`);
      }

      const payload = (await response.json()) as LaravelMediaPayload | null;
      if (!payload) {
        return null;
      }

      return {
        id: payload.id,
        url: payload.url,
        alt: payload.alt,
        width: payload.width,
        height: payload.height,
      };
    },
  };
}

export function mountFilamentBridge(options: MountFilamentBuilderOptions) {
  const channel = {
    getValue() {
      return structuredClone(options.initialValue);
    },
    setValue(document: PageDocument) {
      options.onChange(document);
    },
    async save(document: PageDocument) {
      await options.onSave?.(document);
    },
  };

  options.element.dispatchEvent(
    new CustomEvent("my-page-builder:mounted", {
      detail: channel,
    }),
  );

  return channel;
}

async function resolveHeaders(
  headers: CreateLaravelAssetPickerOptions["headers"],
): Promise<HeadersInit> {
  if (!headers) {
    return {};
  }

  return typeof headers === "function" ? await headers() : headers;
}
