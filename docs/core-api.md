# API du coeur (`@n-ramos/celebrimbor-core`)

Le package `core` est headless : aucune dependance React, Vue, DOM ou Laravel. Il expose le modele de document, les operations immutables, le registry de blocs, la validation, l'historique, le bus d'evenements et un moteur de rendu abstrait.

Toutes les operations sont **pures et immutables** : elles renvoient un nouveau document sans muter l'entree.

## Modele de document

```ts
type PageBlock<TContent = Record<string, unknown>, TSettings = Record<string, unknown>> = {
  id: string;
  type: string;
  content: TContent;
  settings?: TSettings;
  children?: PageBlock[];
  visible?: boolean;
};

type PageDocument = {
  version: string;
  id?: string;
  title?: string;
  blocks: PageBlock[];
  meta?: Record<string, unknown>;
};
```

- `createDocument(input?)` cree un document avec `version` par defaut (`CURRENT_DOCUMENT_VERSION`) et clone les `blocks`/`meta` fournis.
- `createBlockFromDefinition(definition, overrides?)` instancie un bloc depuis une definition (id genere via `crypto.randomUUID` quand disponible).

## Operations sur les blocs

| Fonction | Effet | Comportement si id introuvable |
| --- | --- | --- |
| `addBlock(doc, blockOrDef, position?, registry?)` | Ajoute un bloc (definition, instance ou type string resolu via registry) en racine ou sous `position.parentId` a `position.index` | Lance si le parent est introuvable ; lance si le type string n'est pas enregistre |
| `updateBlock(doc, id, patch)` | Fusionne `patch` dans le bloc cible | Renvoie le document inchange (meme reference) |
| `removeBlock(doc, id)` | Retire le bloc | Renvoie le document inchange |
| `duplicateBlock(doc, id)` | Insere une copie juste apres l'original, avec de **nouveaux** ids (bloc et descendants) | Renvoie le document inchange |
| `toggleBlockVisibility(doc, id)` | Bascule `visible` (defaut implicite `true`) | Renvoie le document inchange |
| `moveBlock(doc, id, target)` | Deplace le bloc vers `target.index` (et `target.parentId` optionnel) | Renvoie le document inchange ; lance si le parent cible est introuvable |

### Semantique de `moveBlock`

`moveBlock` retire d'abord le bloc, puis le reinsere a `target.index` **dans le document apres retrait**. L'index cible se raisonne donc sur la collection post-suppression. L'identite (`id`) du bloc deplace et de ses enfants est **preservee** (contrairement a `duplicateBlock`).

## Registry de blocs

```ts
const registry = createBlockRegistry([heroBlock]);
registry.register(def);          // throw si le type existe deja
registry.unregister("hero");
registry.registerLazy("x", loader); // chargement asynchrone via resolve()
await registry.resolve("x");     // resout + met en cache la definition lazy
registry.get("hero");            // definition ou fallback unknownFactory
registry.has("hero");            // true uniquement si reellement enregistre/lazy
registry.all();
registry.byCategory();           // Record<category, definition[]>
registry.createBlock("hero", overrides?);
registry.setUnknownBlockFactory(createUnknownBlockDefinition);
```

`get` renvoie le resultat de l'`unknownFactory` pour un type inconnu alors que `has` reste `false` : la factory est un repli, pas un enregistrement.

### Marketplace de blocs (lazy)

Pour distribuer des blocs charges a la demande, `registerBlockManifest(registry, entries)` enregistre chaque entree comme bloc lazy (idempotent). `createBlockCatalog(entries)` fournit un listing (`entries`, `get`, `byCategory`, `search`) exploitable par une UI **avant** tout chargement.

```ts
import { createBlockCatalog, registerBlockManifest } from "@n-ramos/celebrimbor-core";

const manifest = [
  { type: "promo", label: "Promo", category: "Marketing", load: () => import("./promo").then((m) => m.promoBlock) },
];

registerBlockManifest(registry, manifest);
const catalog = createBlockCatalog(manifest); // pour la librairie UI
await registry.resolve("promo");              // charge + met en cache a la demande
```

## Validation

`validateDocument(doc, registry)` parcourt l'arbre et agrege des `ValidationIssue` (`path`, `message`, `code`, `severity`). Pour chaque bloc :

1. type totalement inconnu (aucune definition, aucune `unknownFactory`) -> issue `unknown_block` de severite `error` ;
2. type rendu via `unknownFactory` -> issue `unknown_block` de severite `warning` (le document **reste valide**, le JSON est preserve) ;
3. validation des `fields` du schema (requis, options `select`/`radio`, `minItems`/`maxItems` des `array`, recursion `object`/`array of object`) ;
4. validation `zodSchema` optionnelle ;
5. fonction `validate` custom optionnelle de la definition.

Seules les issues de severite `error` (defaut quand `severity` est absent) rendent un document invalide : `valid === false` ssi au moins une issue `error` existe.

### Generer le `zodSchema` depuis les `fields`

Pour eviter de declarer deux fois la forme du contenu, `schemaToZod(fields)` derive un schema Zod a partir des `fields` (source unique de verite) :

```ts
import { schemaToZod, withGeneratedZodSchema } from "@n-ramos/celebrimbor-core";

const schema = { fields };
schema.zodSchema = schemaToZod(fields);
// ou, sans ecraser un zodSchema existant :
const enriched = withGeneratedZodSchema(schema);
```

Mapping : champs texte (`text`/`textarea`/`richtext`/`markdown`/`url`/`color`/`date`) -> `string` (`.min(1)` si `required`), `number`/`range` -> `number` (avec `.min`/`.max`), `boolean`, `select`/`radio`/`alignment`/`textalign` -> `enum`, `asset` -> objet nullable, `custom` -> `unknown`, `object` recursif, `array` avec `.min`/`.max`. Les conteneurs `row`/`tabs` sont aplatis (leurs enfants remontent au niveau parent). Les champs non `required` deviennent optionnels.

## Historique

`createHistory(doc, limit = 50)` puis `pushHistory`, `undoHistory`, `redoHistory`. `push` empile l'ancien present dans `past` (tronque a `limit`) et vide `future`. Tous les etats sont clones en profondeur.

## Bus d'evenements

`createEventBus<TEvents>()` -> `on(type, listener)` (renvoie une fonction de desinscription), `emit(type, payload)`, `clear()`. Type d'evenements par defaut : `PageBuilderEventMap` (`document:changed`, `document:saved`, `block:selected`, `block:updated`).

## Rendu abstrait

`renderDocument(doc, registry, strategy)` rend une sortie de type arbitraire `TOutput[]`. La strategie recoit `{ block, definition, children }`. Les blocs invisibles (et enfants invisibles) sont filtres ; `definition` vaut `undefined` pour un type inconnu. Cette abstraction permet un rendu React, HTML string, JSON, etc.

### Rendu HTML headless

`renderDocumentToHtml(doc, registry, options?)` produit une **chaine HTML sans dependance React ni DOM** (rendu cote serveur). Pour chaque bloc, le renderer est resolu dans l'ordre : `options.renderers[type]` -> `definition.renderHtml` -> `options.fallback` -> repli generique (`<div data-block-type>`).

```ts
import { renderDocumentToHtml, escapeHtml } from "@n-ramos/celebrimbor-core";

const html = renderDocumentToHtml(document, registry, {
  renderers: {
    hero: ({ block }) => `<h1>${escapeHtml(String(block.content.title ?? ""))}</h1>`,
  },
});
```

Une definition de bloc peut aussi porter directement un `renderHtml: ({ block, childrenHtml }) => string`.

## Templates / presets

`defineTemplate({ name, label, category?, create })` decrit une fabrique de document. `createTemplateRegistry()` expose `register`/`get`/`has`/`all`/`byCategory`/`instantiate`. `instantiate(name)` renvoie un nouveau `PageDocument` clone a chaque appel.

```ts
import { createTemplateRegistry, defineTemplate, createDocument } from "@n-ramos/celebrimbor-core";

const templates = createTemplateRegistry([
  defineTemplate({ name: "landing", label: "Landing", create: () => createDocument({ title: "Landing" }) }),
]);

const doc = templates.instantiate("landing");
```

## Migrations

`migrateDocument(doc, migrations)` applique en chaine les migrations dont `from` correspond a la `version` courante, jusqu'a ce qu'aucune ne corresponde. Le document d'entree n'est pas mute.

## Serialisation

- `serializeDocument` / `deserializeDocument` : JSON complet et fidele du `PageDocument`.
- `serializePortableDocument` / `deserializePortableDocument` : format plat agnostique (`_name`, `_id`, `_settings`, `_visible`, `_children` + champs de contenu a plat). Voir la limitation sur les collisions de cles dans [`portable-json-and-web-component.md`](./portable-json-and-web-component.md).
