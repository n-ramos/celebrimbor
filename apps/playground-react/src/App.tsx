import { useMemo, useState } from "react";
import { createDocument, createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { PageBuilder } from "@n-ramos/celebrimbor-editor-react";
import { basicBlocks, registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { createLocalStorageAdapter } from "@n-ramos/celebrimbor-adapter-local-storage";

const storage = createLocalStorageAdapter({ keyPrefix: "my-page-builder-playground" });

export function App() {
  const registry = useMemo(() => registerBasicBlocks(createBlockRegistry()), []);
  const [document, setDocument] = useState(
    createDocument({
      id: "playground-home",
      title: "Playground Home",
      blocks: basicBlocks.slice(0, 3).map((definition, index) =>
        registry.createBlock(definition.type, { id: `seed-${index}` }),
      ),
    }),
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1720px]">
        <PageBuilder
          document={document}
          registry={registry}
          storage={storage}
          onChange={setDocument}
          onSave={async (nextDocument) => {
            await storage.save(nextDocument);
          }}
        />
      </div>
    </main>
  );
}
