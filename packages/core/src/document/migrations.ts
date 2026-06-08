import type { PageDocument } from "./types";

export type DocumentMigration = {
  from: string;
  to: string;
  migrate: (document: PageDocument) => PageDocument;
};

export function migrateDocument(document: PageDocument, migrations: DocumentMigration[]): PageDocument {
  let current = structuredClone(document);
  const pending = [...migrations];

  while (true) {
    const nextMigration = pending.find((migration) => migration.from === current.version);
    if (!nextMigration) {
      return current;
    }

    current = nextMigration.migrate(current);
    pending.splice(pending.indexOf(nextMigration), 1);
  }
}
