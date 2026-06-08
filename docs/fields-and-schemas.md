# Fields et schemas

Ce guide documente le systeme de fields utilise par `@n-ramos/core` et rendu par `SchemaForm` dans `@n-ramos/editor-react`.

L'objectif est simple:

- decrire un contenu editable une seule fois
- reutiliser cette definition dans le builder
- persister les donnees dans un JSON stable
- rester portable entre React, web component, backend, ou un autre renderer

## Mental model

Un bloc contient generalement deux zones de donnees:

- `content`
  Le contenu editorial du bloc.
- `settings`
  Les parametres de presentation ou de comportement.

Chaque zone est decrite par un `BlockSchema`.

Exemple:

```ts
import { defineBlock } from "@n-ramos/core";

export const ctaBlock = defineBlock({
  type: "cta",
  label: "CTA",
  defaultContent: {
    title: "Start now",
    text: "Explain the value proposition.",
    buttonLabel: "Get started",
    buttonUrl: "#",
  },
  defaultSettings: {
    alignment: "left",
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
      { name: "buttonLabel", type: "text", label: "Button label" },
      { name: "buttonUrl", type: "url", label: "Button URL" },
    ],
  },
  settingsSchema: {
    fields: [
      {
        name: "alignment",
        type: "radio",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
        ],
      },
    ],
  },
});
```

## Types disponibles

Les types de fields supportes par le core sont:

```ts
type PrimitiveFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "markdown"
  | "number"
  | "boolean"
  | "select"
  | "radio"
  | "color"
  | "url"
  | "asset";

type BlockFieldType = PrimitiveFieldType | "object" | "array";
```

En pratique:

- `text`
  Une chaine courte, ex: titre, label, alt.
- `textarea`
  Un texte multiline simple.
- `richtext`
  Un contenu WYSIWYG HTML.
- `markdown`
  Un contenu texte brut au format Markdown.
- `number`
  Une valeur numerique.
- `boolean`
  Un toggle vrai/faux.
- `select`
  Une liste deroulante.
- `radio`
  Une selection par boutons/options.
- `color`
  Une couleur CSS.
- `url`
  Une URL.
- `asset`
  Une ressource media, typiquement une image.
- `object`
  Un groupe de sous-fields imbriques.
- `array`
  Un field repeatable, ideal pour FAQ, colonnes, galleries, features, pricing rows, etc.

## Proprietes communes

Chaque field partage un socle commun:

```ts
type BaseField<TValue = unknown> = {
  name: string;
  type: BlockFieldType;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: TValue;
};
```

### `name`

Cle stockee dans le JSON.

Exemple:

```ts
{ name: "title", type: "text", label: "Title" }
```

produit:

```json
{
  "title": "My block title"
}
```

### `label`

Texte affiche dans l'UI du builder.

### `description`

Texte d'aide sous le label. Tres utile pour les fields ambigus ou techniques.

Exemple:

```ts
{
  name: "buttonUrl",
  type: "url",
  label: "Button URL",
  description: "Can be an internal slug, a relative URL, or an absolute URL."
}
```

### `required`

Indique qu'un field est important. Le form l'affiche avec un marqueur visuel, mais la vraie validation metier reste a faire dans `validate`.

### `defaultValue`

Permet de definir une valeur par defaut au niveau du field lui-meme. Particulierement utile dans les `object` et `array`.

## Primitive fields

### `text`

Pour les labels courts.

```ts
{ name: "title", type: "text", label: "Title" }
```

### `textarea`

Pour du texte simple multiline.

```ts
{ name: "description", type: "textarea", label: "Description" }
```

### `richtext`

Pour du contenu riche editable en WYSIWYG, serialise en HTML.

```ts
{
  name: "body",
  type: "richtext",
  label: "Body",
  required: true,
}
```

Quand utiliser `richtext`:

- article
- section de contenu libre
- presentation marketing

Quand ne pas l'utiliser:

- champs courts
- microcopies
- structures fortement contraintes

### `markdown`

Pour stocker du Markdown brut.

```ts
{
  name: "body",
  type: "markdown",
  label: "Markdown body",
}
```

Bon choix si:

- tu veux versionner/relire du texte brut plus facilement
- ton renderer final parse deja du Markdown
- tu veux eviter le HTML dans la persistence

### `number`

```ts
{ name: "columns", type: "number", label: "Columns" }
```

### `boolean`

```ts
{ name: "showBadge", type: "boolean", label: "Show badge" }
```

### `select`

Utilise `options`.

```ts
{
  name: "spacingTop",
  type: "select",
  label: "Top spacing",
  options: [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ],
}
```

### `radio`

Pratique quand il faut comparer visuellement quelques choix.

```ts
{
  name: "alignment",
  type: "radio",
  label: "Alignment",
  options: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
  ],
}
```

### `color`

```ts
{
  name: "backgroundColor",
  type: "color",
  label: "Background color",
  defaultValue: "#ffffff",
}
```

### `url`

```ts
{
  name: "buttonUrl",
  type: "url",
  label: "Button URL",
}
```

### `asset`

Pour une image ou une ressource media.

```ts
{
  name: "image",
  type: "asset",
  label: "Image",
}
```

Le type serialise est:

```ts
type Asset = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  meta?: Record<string, unknown>;
};
```

Le `SchemaForm` supporte:

- preview visuelle
- selection via `assetPicker`
- remplacement
- suppression
- edition manuelle de l'URL
- alt text

## Object fields

Un `object` groupe plusieurs sous-fields.

Exemple classique: un bouton.

```ts
{
  name: "primaryButton",
  type: "object",
  label: "Primary button",
  fields: [
    { name: "label", type: "text", label: "Label" },
    { name: "url", type: "url", label: "URL" },
  ],
}
```

JSON produit:

```json
{
  "primaryButton": {
    "label": "Start now",
    "url": "/signup"
  }
}
```

Quand utiliser `object`:

- bouton
- media avec metadonnees
- bloc SEO
- configuration de badge
- callout compose de plusieurs proprietes

## Array fields et repeatable fields

`array` est le type cle pour les repeatable fields.

Il permet de gerer des listes repetables dans un bloc.

Exemples de cas d'usage:

- items d'une FAQ
- slides d'un carrousel
- cartes de pricing
- colonnes d'une section
- images de galerie
- logos de partenaires

### Structure

```ts
{
  name: "items",
  type: "array",
  label: "Items",
  itemLabel: "Item",
  minItems: 1,
  maxItems: 6,
  of: {
    name: "item",
    type: "object",
    label: "Item",
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
    ],
  },
}
```

### Proprietes specifiques

#### `of`

Definit le type d'item contenu dans la liste.

Supporte:

- un field primitif
- un `object`

En pratique, `object` est le cas le plus utile.

#### `itemLabel`

Texte de reference pour l'UI.

Exemple:

```ts
itemLabel: "FAQ item"
```

#### `minItems`

Nombre minimal d'entrees autorisees.

#### `maxItems`

Nombre maximal d'entrees autorisees.

### Exemple FAQ complet

```ts
{
  name: "items",
  type: "array",
  label: "Questions",
  itemLabel: "Question",
  minItems: 1,
  of: {
    name: "faqItem",
    type: "object",
    label: "FAQ item",
    fields: [
      { name: "question", type: "text", label: "Question", required: true },
      { name: "answer", type: "textarea", label: "Answer", required: true },
    ],
  },
}
```

JSON produit:

```json
{
  "items": [
    {
      "question": "What is this?",
      "answer": "A headless page builder."
    },
    {
      "question": "Can I use it outside React?",
      "answer": "Yes, through the web component."
    }
  ]
}
```

### Exemple galerie avec images repeatables

```ts
{
  name: "items",
  type: "array",
  label: "Images",
  itemLabel: "Image",
  of: {
    name: "galleryItem",
    type: "object",
    label: "Gallery item",
    fields: [
      { name: "image", type: "asset", label: "Image" },
      { name: "caption", type: "text", label: "Caption" },
    ],
  },
}
```

### Bonnes pratiques pour les repeatable fields

- Garde des items simples et focalises.
- Prefere plusieurs petits fields clairs a un seul `richtext` surpuissant.
- Definis `minItems` si le bloc n'a pas de sens sans contenu.
- Definis `maxItems` si ton rendu final a des contraintes de layout.
- Utilise `itemLabel` pour une UI plus lisible.
- Donne un `defaultValue` aux sous-fields quand tu veux accelerer l'edition.

## Validation

Le schema sert a decrire le form, mais la validation metier peut aller plus loin via `validate`.

Exemple:

```ts
import { defineBlock } from "@n-ramos/core";

export const heroBlock = defineBlock({
  type: "hero",
  label: "Hero",
  defaultContent: {
    title: "",
    primaryButton: {
      label: "",
      url: "",
    },
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      {
        name: "primaryButton",
        type: "object",
        label: "Primary button",
        fields: [
          { name: "label", type: "text", label: "Label" },
          { name: "url", type: "url", label: "URL" },
        ],
      },
    ],
  },
  validate(content) {
    const errors: string[] = [];

    if (!content.title?.trim()) {
      errors.push("Hero title is required.");
    }

    if (content.primaryButton?.label && !content.primaryButton?.url) {
      errors.push("Primary button URL is required when a label is present.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
});
```

## `content` vs `settings`

Regle simple:

- `content` = ce que l'editeur redige
- `settings` = comment le bloc se comporte ou s'affiche

Exemples de `content`:

- titre
- texte
- image
- liste FAQ
- CTA label

Exemples de `settings`:

- alignement
- espacement
- theme visuel
- largeur
- variant
- mode compact

Cette separation aide beaucoup:

- a garder des JSON plus lisibles
- a differencier le fond et la forme
- a brancher plus facilement plusieurs renderers

## Exemples de schemas complets

### Hero marketing

```ts
schema: {
  fields: [
    { name: "eyebrow", type: "text", label: "Eyebrow" },
    { name: "title", type: "text", label: "Title", required: true },
    { name: "text", type: "textarea", label: "Text" },
    {
      name: "primaryButton",
      type: "object",
      label: "Primary button",
      fields: [
        { name: "label", type: "text", label: "Label" },
        { name: "url", type: "url", label: "URL" },
      ],
    },
    { name: "image", type: "asset", label: "Image" },
    { name: "imageAlt", type: "text", label: "Image alt" },
  ],
}
```

### Colonnes repeatables

```ts
schema: {
  fields: [
    { name: "title", type: "text", label: "Title" },
    {
      name: "columns",
      type: "array",
      label: "Columns",
      itemLabel: "Column",
      minItems: 1,
      of: {
        name: "column",
        type: "object",
        label: "Column",
        fields: [
          { name: "title", type: "text", label: "Title", required: true },
          { name: "text", type: "textarea", label: "Text" },
        ],
      },
    },
  ],
}
```

### Rich content block

```ts
schema: {
  fields: [
    { name: "body", type: "richtext", label: "Body", required: true },
  ],
}
```

## Conseils de modelisation

### 1. Modele les structures, pas l'UI du form

Mauvais reflexe:

- "je veux un tab Content et un tab Style"

Bon reflexe:

- "j'ai du contenu editorial"
- "j'ai des settings d'apparence"

### 2. Evite les mega objets

Mieux vaut:

- `primaryButton`
- `secondaryButton`

que:

- `buttons` avec une structure floue des le depart

### 3. Utilise `array` des que l'ordre compte

Si l'utilisateur doit:

- ajouter
- supprimer
- reordonner
- repeter

alors tu veux presque toujours un `array`.

### 4. Garde les noms de fields stables

`name` est une cle de persistence. Si tu la renommes, tu casses potentiellement du contenu existant.

### 5. Ajoute des `description` sur les fields ambigus

Particulierement utile pour:

- URL
- SEO
- image alt
- fields techniques
- variants visuels

## Checklist avant de valider un schema

- Les noms de fields sont-ils stables et explicites ?
- Le bloc separe-t-il bien `content` et `settings` ?
- Les listes repeatables sont-elles modelisees en `array` ?
- Les sous-structures sont-elles modelisees en `object` ?
- Les images utilisent-elles `asset` ?
- Les options visuelles courtes utilisent-elles `radio` ou `select` ?
- Les contraintes de layout sont-elles refletees par `minItems` / `maxItems` ?
- Les champs critiques sont-ils marques `required` ?
