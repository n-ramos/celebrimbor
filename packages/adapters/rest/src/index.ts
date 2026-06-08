import type { PageBuilderStorage, PageDocument } from "@n-ramos/celebrimbor-core";

export type RestStorageOptions = {
  baseUrl: string;
  headers?: HeadersInit | (() => Promise<HeadersInit> | HeadersInit);
  fetcher?: typeof fetch;
  idField?: string;
};

export function createRestStorage(options: RestStorageOptions): PageBuilderStorage {
  const fetcher = options.fetcher ?? fetch;

  return {
    async load(id: string): Promise<PageDocument> {
      const response = await fetcher(`${options.baseUrl}/${id}`, {
        method: "GET",
        headers: await resolveHeaders(options.headers),
      });

      await assertResponse(response);
      return (await response.json()) as PageDocument;
    },
    async save(document: PageDocument): Promise<void> {
      const identifier = document.id ?? "draft";
      const method = document.id ? "PUT" : "POST";
      const url = document.id ? `${options.baseUrl}/${identifier}` : options.baseUrl;
      const body = JSON.stringify(document);
      const response = await fetcher(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(await resolveHeaders(options.headers)),
        },
        body,
      });

      await assertResponse(response);
    },
    async publish(document: PageDocument): Promise<void> {
      if (!document.id) {
        throw new Error("Cannot publish a document without an id.");
      }

      const response = await fetcher(`${options.baseUrl}/${document.id}/publish`, {
        method: "POST",
        headers: await resolveHeaders(options.headers),
      });
      await assertResponse(response);
    },
    async preview(document: PageDocument): Promise<string> {
      const response = await fetcher(`${options.baseUrl}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await resolveHeaders(options.headers)),
        },
        body: JSON.stringify(document),
      });
      await assertResponse(response);
      const payload = (await response.json()) as { url: string };
      return payload.url;
    },
  };
}

async function resolveHeaders(
  headers: RestStorageOptions["headers"],
): Promise<HeadersInit> {
  if (!headers) {
    return {};
  }

  return typeof headers === "function" ? await headers() : headers;
}

async function assertResponse(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  throw new Error(`REST storage request failed with status ${response.status}.`);
}
