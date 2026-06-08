import { useMemo, useState } from "react";
import { createDocument, createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { PageBuilder, type CustomFieldRegistry } from "@n-ramos/celebrimbor-editor-react";
import { basicBlocks, registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { createLocalStorageAdapter } from "@n-ramos/celebrimbor-adapter-local-storage";
import { showcaseBlock } from "./blocks/showcase";
import { ColorSwatchField } from "./custom-fields/color-swatch";

const storage = createLocalStorageAdapter({ keyPrefix: "my-page-builder-playground" });

// Registre des champs `custom` passe a l'editeur: la cle correspond au
// `component` declare dans le schema (ici `color-swatch` du bloc Showcase).
const customFields: CustomFieldRegistry = {
  "color-swatch": ColorSwatchField,
};

export function App() {
  const registry = useMemo(() => {
    const next = registerBasicBlocks(createBlockRegistry());
    next.register(showcaseBlock);
    return next;
  }, []);
  const [document, setDocument] = useState(
    createDocument({
      id: "playground-home",
      title: "Playground Home",
      blocks: [
        registry.createBlock(showcaseBlock.type, { id: "seed-showcase" }),
        ...basicBlocks.slice(0, 2).map((definition, index) =>
          registry.createBlock(definition.type, { id: `seed-${index}` }),
        ),
      ],
    }),
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1720px]">
        <PageBuilder
          document={document}
          registry={registry}
          storage={storage}
          customFields={customFields}
          onChange={setDocument}
          onSave={async (nextDocument) => {
            await storage.save(nextDocument);
          }}
        />
      </div>
    </main>
  );
}
