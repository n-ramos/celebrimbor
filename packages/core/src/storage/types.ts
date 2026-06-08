import type { PageDocument } from "../document/types";

export interface PageBuilderStorage {
  load(id: string): Promise<PageDocument>;
  save(document: PageDocument): Promise<void>;
  publish?(document: PageDocument): Promise<void>;
  preview?(document: PageDocument): Promise<string>;
}
