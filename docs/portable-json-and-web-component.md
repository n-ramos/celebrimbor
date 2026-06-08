# Portable JSON et web component

Le projet a deux formats de sortie principaux:

1. le `PageDocument` complet
2. le JSON portable "flat block" inspire de `ciklik/visual-editor`

Le web component `@n-ramos/page-builder-element` permet d'embarquer le builder hors React tout en gardant l'un ou l'autre de ces formats.

## `PageDocument`

Le format complet:

```ts
type PageDocument = {
  version: string;
  id?: string;
  title?: string;
  blocks: PageBlock[];
  meta?: Record<string, unknown>;
};

type PageBlock = {
  id: string;
  type: string;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  children?: PageBlock[];
  visible?: boolean;
};
```

Ce format est ideal si:

- tu controles toute la stack
- tu veux garder les metadonnees completes
- tu veux travailler a un niveau "document editor"

## Format portable

Le format portable flattene la structure de bloc pour etre plus facile a manipuler dans des environnements heterogenes.

Type:

```ts
type PortableBlock = {
  _name: string;
  _id?: string;
  _settings?: Record<string, unknown>;
  _visible?: boolean;
  _children?: PortableBlock[];
} & Record<string, unknown>;
```

Exemple:

```json
[
  {
    "_name": "hero",
    "_id": "hero-home",
    "title": "Build visually",
    "text": "Portable JSON output",
    "_settings": {
      "alignment": "center"
    }
  }
]
```

## Mapping entre les deux

Un bloc `PageBlock`:

```json
{
  "id": "hero-home",
  "type": "hero",
  "content": {
    "title": "Build visually",
    "text": "Portable JSON output"
  },
  "settings": {
    "alignment": "center"
  },
  "visible": true
}
```

devient:

```json
{
  "_id": "hero-home",
  "_name": "hero",
  "title": "Build visually",
  "text": "Portable JSON output",
  "_settings": {
    "alignment": "center"
  },
  "_visible": true
}
```

## API de serialisation

Le core expose:

```ts
import {
  serializeDocument,
  deserializeDocument,
  serializePortableDocument,
  deserializePortableDocument,
} from "@n-ramos/core";
```

### Serialiser le document complet

```ts
const raw = serializeDocument(document);
```

### Deserialiser le document complet

```ts
const document = deserializeDocument(raw);
```

### Serialiser en format portable

```ts
const portable = serializePortableDocument(document);
```

### Deserialiser le format portable

```ts
const document = deserializePortableDocument(portable, {
  id: "home",
  title: "Homepage",
});
```

## Quand utiliser le format portable

Choisis `portable` si:

- tu veux exposer un JSON simple a un CMS ou un back-office
- tu veux rester agnostique du framework de rendu
- tu veux transmettre le contenu a une autre app ou un autre service
- tu veux te rapprocher d'un format "block payload" simple

Choisis `document` si:

- tu veux garder toutes les metadonnees de document
- tu veux travailler avec le model interne complet
- tu veux utiliser toutes les operations du core sans adaptation

## Web component

`@n-ramos/page-builder-element` emballe le builder React dans un custom element.

## Definition

```ts
import "@n-ramos/page-builder-element/styles.css";
import { createBlockRegistry } from "@n-ramos/core";
import { registerBasicBlocks } from "@n-ramos/blocks-basic";
import { definePageBuilderElement } from "@n-ramos/page-builder-element";

const registry = registerBasicBlocks(createBlockRegistry());

definePageBuilderElement({
  registry,
});
```

## Usage HTML

```html
<my-page-builder
  name="document"
  format="portable"
  value='[{"_name":"hero","title":"Build visually","text":"Portable JSON output"}]'
></my-page-builder>
```

## Attributs importants

### `name`

Nom du champ cache synchronise.

Utile pour les formulaires HTML classiques ou les integrations admin.

### `value`

Le JSON initial. Peut contenir:

- un `PageDocument`
- ou un tableau de `PortableBlock` si `format="portable"`

### `format`

Supporte:

- `portable`
- `document`

`portable` est la valeur par defaut.

## Proprietes runtime

Tu peux aussi configurer le composant via JavaScript:

```ts
const element = document.querySelector("my-page-builder");

element.registry = registry;
element.format = "portable";
element.assetPicker = {
  async pickAsset() {
    return {
      id: "asset_1",
      url: "https://cdn.example.com/hero.jpg",
      alt: "Hero image",
    };
  },
};
```

## Evenements emis

Le composant emet:

- `my-page-builder:change`
- `my-page-builder:save`

Exemple:

```ts
element.addEventListener("my-page-builder:change", (event) => {
  console.log(event.detail.document);
});
```

## Integration backend type CMS / admin

Le pattern recommande:

1. le backend stocke le JSON
2. le web component monte dans le formulaire
3. le champ cache transporte la valeur serializee
4. le renderer final interprete ensuite le JSON persiste

Tu restes ainsi:

- backend agnostique
- frontend agnostique
- libre de changer le renderer plus tard

## Limitation: collisions de cles reservees

Le format portable aplatit le contenu au meme niveau que les cles reservees `_name`, `_id`, `_settings`, `_visible` et `_children`. Si un champ de contenu porte l'un de ces noms, il **entre en collision** et la donnee est perdue ou ecrasee au moment de `serializePortableDocument` (le spread du contenu intervient apres les cles reservees, donc un champ `_name` ecrase le type du bloc).

A retenir :

- N'utilise jamais de cles de contenu prefixees par `_` dans tes blocs destines au format portable.
- Si tu dois absolument transporter de telles cles, utilise le format `document` complet.
- Un round-trip `document -> portable -> document` n'est garanti fidele que si aucun champ de contenu n'utilise une cle reservee.

## Conseils pour le format portable

- Traite `_name` comme l'identifiant stable du bloc.
- Ne renomme pas tes `type` de blocs a la legere.
- Garde les cles de contenu a plat et lisibles.
- Reserve `_settings` aux variantes de presentation.
- Reserve `_children` aux blocs imbriques.

## Exemple de pipeline complet

### 1. Edition

L'utilisateur modifie un document dans le web component.

### 2. Persistence

Le formulaire soumet:

```json
[
  {
    "_name": "hero",
    "title": "Build visually",
    "text": "Portable JSON output"
  },
  {
    "_name": "faq",
    "items": [
      {
        "question": "Can I render this in Vue?",
        "answer": "Yes, if you implement a renderer."
      }
    ]
  }
]
```

### 3. Rendu final

Ton frontend de production:

- charge ce JSON
- deserialise si necessaire
- mappe `_name` vers le composant ou renderer adapte

## Checklist d'integration

- Le registry est-il complet avant le montage ?
- Le format persiste est-il bien defini (`portable` ou `document`) ?
- Le backend stocke-t-il le JSON brut sans transformation destructive ?
- L'`assetPicker` est-il branche si tu utilises des `asset` fields ?
- Le renderer final connait-il tous les `type` / `_name` utilises ?
