# Editeur Vue (`@n-ramos/editor-vue`)

Port Vue 3 de l'editeur, ecrit en render functions (`h()`, sans SFC) et reutilisant integralement `@n-ramos/core`. La preview s'appuie sur le renderer HTML headless du core, donc l'editeur Vue ne depend d'aucun renderer React.

## Exports

- `PageBuilder` : editeur complet (librairie de blocs, canvas avec selection / reordonnancement haut-bas / suppression, inspecteur, preview, bouton enregistrer). `v-model:document` + evenement `save`.
- `SchemaForm` : formulaire pilote par schema (champs primitifs, objets, arrays) avec affichage des anomalies (`issues`).
- `PageRenderer` : rendu du document en HTML via `renderDocumentToHtml`.
- `BlockInspector` : edition contenu/reglages du bloc selectionne avec validation live.
- `usePageBuilder(documentRef, onChange)` : composable equivalent au hook React.

## Usage

```ts
import { createApp, ref } from "vue";
import { createBlockRegistry, createDocument } from "@n-ramos/core";
import { registerBasicBlocks } from "@n-ramos/blocks-basic";
import { PageBuilder } from "@n-ramos/editor-vue";

const registry = registerBasicBlocks(createBlockRegistry());

createApp({
  setup() {
    const document = ref(createDocument({ title: "Home" }));
    return () =>
      h(PageBuilder, {
        document: document.value,
        registry,
        "onUpdate:document": (next) => (document.value = next),
        onSave: (doc) => console.log("save", doc),
      });
  },
}).mount("#app");
```

> Remarque : les blocs de `@n-ramos/blocks-basic` fournissent un `render` **React**. Pour une preview Vue riche, ajoute un `renderHtml` a tes definitions (utilise par `PageRenderer` / `renderDocumentToHtml`) ; sinon le repli generique affiche un wrapper avec le texte du contenu.

## Limites actuelles

Editeur volontairement minimal : pas de drag & drop ni d'editeur WYSIWYG (contrairement a `editor-react`). Le reordonnancement se fait via les boutons haut/bas. Ces ecarts sont des candidats naturels pour la suite.
