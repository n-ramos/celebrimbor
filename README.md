# My Page Builder

Monorepo `pnpm` pour une librairie npm de visual page builder agnostique, inspirée des éditeurs visuels modernes mais conçue dès le départ pour rester :

- headless côté métier
- découplée du backend
- portable entre frameworks UI
- sérialisable en JSON stable

Le cœur ne contient aucun PHP. Laravel et Filament ne sont présents que comme exemple d'intégration consommatrice.

## Vision

Le projet sépare strictement les couches suivantes :

1. `@n-ramos/celebrimbor-core`
   Types, document model, registry, validation, historique, événements, rendu abstrait, storage contract.
2. `@n-ramos/celebrimbor-editor-react`
   Builder React, canvas, inspector, renderer React et `SchemaForm`.
3. `@n-ramos/celebrimbor-editor-element`
   Custom element pour embarquer le builder dans n'importe quelle page HTML ou back-office.
4. `@n-ramos/celebrimbor-blocks-basic`
   Preset de blocs marketing fournis en exemple.
5. `adapters`
   Branches de persistence et ponts d'intégration vers des environnements réels.
6. `@n-ramos/celebrimbor-editor-vue`
   Éditeur Vue 3 fonctionnel (composable `usePageBuilder`, `SchemaForm`, `PageBuilder`, `PageRenderer`) réutilisant le core ; preview via le renderer HTML headless.

## Documentation developpeur

La documentation detaillee est dans [`docs/`](./docs/README.md) :

- [API du coeur](./docs/core-api.md)
- [Fields et schemas](./docs/fields-and-schemas.md)
- [Creer un bloc](./docs/creating-blocks.md)
- [Portable JSON et web component](./docs/portable-json-and-web-component.md)
- [Integrer la lib dans Laravel](./docs/laravel-integration.md)
- [Editeur Vue](./docs/vue-integration.md)
- [Analyse et recommandations](./docs/analysis-and-recommendations.md)

## Arborescence

```txt
packages/
  core/
  editor-react/
  editor-vue/        # éditeur Vue 3 (render functions)
  editor-element/
  adapters/
    laravel-filament/
    local-storage/
    rest/
  blocks/
    basic/
apps/
  playground-react/
  playground-vue/    # placeholder
  docs/
examples/
  laravel-filament/
```

## Packages

### `@n-ramos/celebrimbor-core`

Responsabilités :

- format `PageDocument` versionné
- `PageBlock` imbriqués
- définition et registry de blocs
- validation runtime basée sur schéma
- sérialisation / désérialisation
- opérations immutables
- historique undo/redo
- event bus
- rendu abstrait, **rendu HTML headless** (`renderDocumentToHtml`, sans React/DOM)
- **génération de schéma Zod** depuis les `fields` (`schemaToZod`)
- **templates / presets** de documents (`defineTemplate`, `createTemplateRegistry`)
- **marketplace de blocs** : enregistrement lazy via manifeste + catalogue (`registerBlockManifest`, `createBlockCatalog`)
- storage abstrait

Garanties :

- aucune dépendance React, Vue, Laravel, Filament ou DOM
- blocs inconnus conservés sans perte
- migrations de documents prévues

### `@n-ramos/celebrimbor-editor-react`

Composants principaux :

- `PageBuilder`
- `BlockCanvas`
- `BlockItem`
- `BlockToolbar`
- `BlockInspector`
- `BlockLibrary`
- `SchemaForm`
- `PreviewFrame`
- `PageRenderer`

Fonctionnalités :

- ajout de blocs
- édition de contenu et settings
- duplication, suppression, visibilité
- drag & drop de réordonnancement
- recherche dans la librairie
- fallback bloc inconnu
- stylesheet Tailwind exportée via `@n-ramos/celebrimbor-editor-react/styles.css`

### `@n-ramos/celebrimbor-editor-element`

Fonctionnalités :

- enregistrement d'un custom element `my-page-builder`
- montage du builder React dans une page HTML sans framework hôte
- synchronisation d'un champ cache JSON via l'attribut `name`
- emission par defaut d'un tableau JSON portable a plat, inspire de `ciklik/visual-editor`
- dispatch des événements `my-page-builder:change` et `my-page-builder:save`
- stylesheet réexportée via `@n-ramos/celebrimbor-editor-element/styles.css`

### `@n-ramos/celebrimbor-blocks-basic`

Blocs fournis :

- `Hero`
- `RichText`
- `ImageText`
- `CTA`
- `FAQ`
- `Gallery`
- `Columns`

Chaque bloc fournit :

- une définition TypeScript
- des valeurs par défaut
- un schéma éditable via `SchemaForm`
- un renderer React

### Adapters

- `@n-ramos/celebrimbor-adapter-local-storage`
  Persistence navigateur simple pour sandbox et prototypage.
- `@n-ramos/celebrimbor-adapter-rest`
  Adapter REST générique avec headers async.
- `@n-ramos/celebrimbor-adapter-laravel-filament`
  Bridge JavaScript pour monter le builder dans un champ Filament et brancher un picker média Laravel.

## Format de document

```ts
export type PageDocument = {
  version: string
  id?: string
  title?: string
  blocks: PageBlock[]
  meta?: Record<string, unknown>
}

export type PageBlock = {
  id: string
  type: string
  content: Record<string, unknown>
  settings?: Record<string, unknown>
  children?: PageBlock[]
  visible?: boolean
}
```

## Exemple rapide

```ts
import { createBlockRegistry, createDocument } from "@n-ramos/celebrimbor-core";
import { registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { createLocalStorageAdapter } from "@n-ramos/celebrimbor-adapter-local-storage";

const registry = registerBasicBlocks(createBlockRegistry());
const storage = createLocalStorageAdapter();

const document = createDocument({
  id: "home",
  title: "Homepage",
  blocks: [registry.createBlock("hero")],
});

await storage.save(document);
```

```tsx
import "@n-ramos/celebrimbor-editor-react/styles.css";

<PageBuilder
  document={document}
  registry={registry}
  storage={storage}
  onChange={setDocument}
  onSave={async (nextDocument) => storage.save(nextDocument)}
/>
```

```ts
import "@n-ramos/celebrimbor-editor-element/styles.css";
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { definePageBuilderElement } from "@n-ramos/celebrimbor-editor-element";

const registry = registerBasicBlocks(createBlockRegistry());
definePageBuilderElement({ registry });
```

```html
<my-page-builder
  name="document"
  format="portable"
  value='[{"_name":"hero","title":"Build visually","text":"Portable JSON output"}]'
></my-page-builder>
```

## Aller plus loin

Pour la documentation poussee sur les `fields`, les repeatable fields, la creation de blocs et le format portable :

- [Fields et schemas](./docs/fields-and-schemas.md)
- [Creer un bloc](./docs/creating-blocks.md)
- [Portable JSON et web component](./docs/portable-json-and-web-component.md)
- [Integrer la lib dans Laravel](./docs/laravel-integration.md)

## Développement

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev:playground-react
pnpm storybook
```

## Tests

La suite de tests (Vitest) couvre ~164 cas :

- `core` : `tree`, `operations`, `history`, `events`, `migrations`, `registry`, `block-manifest`, `validation`, `serialize`, `renderer`, `render-to-html`, `schema-to-zod`, `templates` (round-trip portable + échappement de collisions, immutabilité)
- `adapters` : `local-storage`, `rest` (fetch mocké), `laravel-filament` (picker + bridge)
- `blocks-basic` : `defaultContent` valide vis-à-vis du schéma + rendu React de chaque bloc
- `editor-react` : montage du builder, `usePageBuilder` (add/insert/update/remove/duplicate/save/sélection contrôlée), `SchemaForm` (validation live, scoping des erreurs imbriquées)
- `editor-vue` : composable, `SchemaForm`, `PageBuilder` (librairie, ajout, save, empty-state)
- `editor-element` : custom element (parsing/serialisation portable vs document, sync du textarea caché)

```bash
pnpm test                                   # tout le monorepo
pnpm test:coverage                          # avec rapport de couverture (v8)
pnpm --filter @n-ramos/celebrimbor-core test    # un seul package
```

L'intégration continue ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) exécute `typecheck`, `test:coverage` et `build` sur chaque push/PR vers `main`.

## Vérifications actuelles

- `pnpm typecheck` passe sur tout le monorepo
- `pnpm test` passe
- `pnpm build` passe

## Limitations connues

- **Format portable et collisions de clés** : un champ de contenu nommé `_name`, `_id`, `_settings`, `_visible` ou `_children` entre en collision avec les clés réservées et est perdu/écrasé au `serializePortableDocument`. Voir `docs/portable-json-and-web-component.md`.
- **`moveBlock`** réinsère le bloc à l'index cible *dans le document après retrait* (sémantique post-suppression). L'identité (`id`) du bloc et de ses enfants est préservée depuis le correctif.
- **Blocs inconnus** : avec un `unknownBlockFactory`, `validateDocument` rétrograde les types inconnus en `warning` (le document reste valide, le JSON est préservé) ; sans fallback, ils restent une `error`.
- **`editor-vue`** est volontairement minimal (champs primitifs, objets, arrays, réordonnancement haut/bas) : pas de drag & drop ni d'éditeur WYSIWYG comme la version React.

Analyse détaillée et axes d'amélioration : [`docs/analysis-and-recommendations.md`](./docs/analysis-and-recommendations.md).

## Laravel / Filament

Le package principal ne dépend jamais de Laravel.

L'exemple d'intégration montre que Laravel ne stocke que :

- `id`
- `title`
- `slug`
- `status`
- `document` JSON
- timestamps

Les blocs restent définis côté JavaScript / TypeScript.

Voir `examples/laravel-filament/README.md` et `packages/adapters/laravel-filament/src/index.ts`.

## Roadmap

- éditeur Vue complet
- éditeur Svelte
- collaborative editing avec Yjs
- autosave et présence
- command palette
- versioning de document
- migrations de schémas
- templates de pages
- responsive controls
- i18n
- multi-langue
- headless rendering
- marketplace de blocs
- undo/redo avancé
- import/export JSON
- permissions par bloc
- preview iframe sécurisée
