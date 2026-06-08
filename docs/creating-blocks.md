# Creer un bloc

Ce guide explique comment concevoir un bloc de bout en bout:

1. definir son type
2. definir ses valeurs par defaut
3. decrire ses fields
4. ajouter ses settings
5. le rendre dans React
6. l'enregistrer dans le registry

## Anatomie d'un bloc

Un bloc est defini avec `defineBlock`.

```ts
import { defineBlock } from "@n-ramos/core";

export const myBlock = defineBlock({
  type: "hero",
  label: "Hero",
  category: "Marketing",
  tags: ["banner", "landing"],
  defaultContent: {
    title: "Build visually",
    text: "Compose pages block by block.",
  },
  defaultSettings: {
    alignment: "left",
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title", required: true },
      { name: "text", type: "textarea", label: "Text" },
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
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      text?: string;
    };

    return (
      <section>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
      </section>
    );
  },
});
```

## Proprietes principales

### `type`

Identifiant stable du bloc.

Regles:

- unique dans le registry
- stable dans le temps
- utilise dans le JSON persiste

Bon exemple:

```ts
type: "pricing-table"
```

Mauvais exemple:

```ts
type: "pricingV2-final"
```

### `label`

Nom visible dans l'UI du builder.

### `category`

Permet de regrouper les blocs dans la modale d'ajout.

Exemples:

- `Marketing`
- `Content`
- `Media`
- `Layout`
- `Commerce`

### `tags`

Mots-clés de recherche dans la modale.

Exemple:

```ts
tags: ["cta", "button", "conversion"]
```

### `defaultContent`

Structure initiale du contenu.

Important:

- elle doit deja refléter la forme attendue du JSON
- elle doit rester coherente avec `schema`

### `defaultSettings`

Valeurs initiales de configuration visuelle ou comportementale.

### `schema`

Decrit le contenu editable.

### `settingsSchema`

Decrit les options de presentation.

### `render`

Transforme le bloc en sortie React dans `@n-ramos/blocks-basic` ou dans ton propre package de renderers.

### `supportsChildren`

Indique que le bloc peut conceptuellement porter des enfants.

Exemple:

```ts
supportsChildren: true
```

Note:

Le model `PageBlock` supporte deja `children`, mais ton UI et ton renderer doivent aussi vraiment exploiter cette capacite.

## Exemple 1: bloc simple

```ts
import { defineBlock } from "@n-ramos/core";

export const announcementBlock = defineBlock({
  type: "announcement",
  label: "Announcement",
  category: "Content",
  defaultContent: {
    text: "Free shipping over 100 EUR",
    linkUrl: "/shipping",
  },
  schema: {
    fields: [
      { name: "text", type: "text", label: "Text", required: true },
      { name: "linkUrl", type: "url", label: "Link URL" },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      text?: string;
      linkUrl?: string;
    };

    return (
      <div className="announcement-bar">
        {content.linkUrl ? <a href={content.linkUrl}>{content.text}</a> : content.text}
      </div>
    );
  },
});
```

## Exemple 2: bloc avec settings

```ts
import { defineBlock } from "@n-ramos/core";

export const quoteBlock = defineBlock({
  type: "quote",
  label: "Quote",
  category: "Content",
  defaultContent: {
    quote: "Portable content matters.",
    author: "Team",
  },
  defaultSettings: {
    theme: "light",
    alignment: "left",
  },
  schema: {
    fields: [
      { name: "quote", type: "textarea", label: "Quote", required: true },
      { name: "author", type: "text", label: "Author" },
    ],
  },
  settingsSchema: {
    fields: [
      {
        name: "theme",
        type: "select",
        label: "Theme",
        options: [
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
        ],
      },
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
  render: ({ block }) => {
    const content = block.content as { quote?: string; author?: string };
    const settings = (block.settings as { theme?: string; alignment?: string }) ?? {};

    return (
      <blockquote data-theme={settings.theme} data-align={settings.alignment}>
        <p>{content.quote}</p>
        {content.author ? <footer>{content.author}</footer> : null}
      </blockquote>
    );
  },
});
```

## Exemple 3: bloc repeatable

```ts
import { defineBlock } from "@n-ramos/core";

export const featuresBlock = defineBlock({
  type: "features",
  label: "Features",
  category: "Marketing",
  defaultContent: {
    title: "Why teams choose this builder",
    items: [
      {
        title: "Portable",
        text: "Content survives UI changes.",
      },
      {
        title: "Composable",
        text: "Blocks stay modular.",
      },
    ],
  },
  schema: {
    fields: [
      { name: "title", type: "text", label: "Title" },
      {
        name: "items",
        type: "array",
        label: "Features",
        itemLabel: "Feature",
        minItems: 1,
        maxItems: 6,
        of: {
          name: "feature",
          type: "object",
          label: "Feature",
          fields: [
            { name: "title", type: "text", label: "Title", required: true },
            { name: "text", type: "textarea", label: "Text" },
          ],
        },
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      title?: string;
      items?: Array<{ title?: string; text?: string }>;
    };

    return (
      <section>
        <h2>{content.title}</h2>
        <div>
          {(content.items ?? []).map((item, index) => (
            <article key={index}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    );
  },
});
```

## Exemple 4: bloc media

```ts
import { defineBlock } from "@n-ramos/core";

export const mediaCardBlock = defineBlock({
  type: "media-card",
  label: "Media card",
  category: "Media",
  defaultContent: {
    image: null,
    imageAlt: "",
    title: "Card title",
    text: "Add a short text.",
  },
  schema: {
    fields: [
      { name: "image", type: "asset", label: "Image" },
      { name: "imageAlt", type: "text", label: "Image alt" },
      { name: "title", type: "text", label: "Title" },
      { name: "text", type: "textarea", label: "Text" },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      image?: { url?: string } | null;
      imageAlt?: string;
      title?: string;
      text?: string;
    };

    return (
      <article>
        {content.image?.url ? <img src={content.image.url} alt={content.imageAlt ?? ""} /> : null}
        <h3>{content.title}</h3>
        <p>{content.text}</p>
      </article>
    );
  },
});
```

## Typage recommande

Quand un bloc devient un peu riche, tape explicitement `content` et `settings` dans le `render`.

Exemple:

```ts
type HeroContent = {
  eyebrow?: string;
  title?: string;
  text?: string;
  primaryButton?: {
    label?: string;
    url?: string;
  };
};

type HeroSettings = {
  alignment?: "left" | "center";
  spacingTop?: "sm" | "md" | "lg";
};
```

Puis:

```ts
render: ({ block }) => {
  const content = block.content as HeroContent;
  const settings = (block.settings as HeroSettings) ?? {};
}
```

## Validation metier

`schema` decrit l'edition. `validate` permet d'appliquer des regles plus fortes.

Exemple:

```ts
validate(content) {
  const errors: string[] = [];

  if (!content.title?.trim()) {
    errors.push("Title is required.");
  }

  if (content.items?.length === 0) {
    errors.push("At least one item is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Enregistrer un bloc dans le registry

```ts
import { createBlockRegistry } from "@n-ramos/core";
import { myBlock } from "./my-block";

const registry = createBlockRegistry();
registry.register(myBlock);
```

Tu peux aussi enregistrer plusieurs blocs:

```ts
registry
  .register(heroBlock)
  .register(featuresBlock)
  .register(mediaCardBlock);
```

## Creer un bloc depuis le registry

```ts
const document = createDocument({
  id: "home",
  blocks: [registry.createBlock("hero")],
});
```

Tu peux aussi overrider au moment de la creation:

```ts
const hero = registry.createBlock("hero", {
  id: "hero-home",
  content: {
    title: "Custom hero",
    text: "Seeded from code.",
  },
});
```

## Ajouter un bloc a un document

Les operations immutables du core permettent de gerer les blocs proprement.

### Ajouter a la racine

```ts
import { addBlock } from "@n-ramos/core";

const nextDocument = addBlock(document, heroBlock);
```

### Ajouter a un index precis

```ts
const nextDocument = addBlock(document, heroBlock, { index: 1 });
```

### Ajouter comme enfant

```ts
const nextDocument = addBlock(document, childBlock, {
  parentId: "layout-root",
  index: 0,
});
```

## Rendu et responsabilites

Dans ce repo, les blocs de `@n-ramos/blocks-basic` rendent du React.

Mais l'architecture reste headless:

- le core ne depend pas de React
- le JSON persiste reste portable
- un autre package pourrait rendre les memes blocs en Vue, Svelte, SSR, ou HTML pur

## Checklist de conception d'un bloc

- Le `type` est-il stable ?
- Le `label` est-il clair pour un editeur ?
- La `category` facilite-t-elle la recherche ?
- Le bloc separe-t-il bien `content` et `settings` ?
- Les listes repetables sont-elles modelisees en `array` ?
- Les groupes logiques sont-ils modelises en `object` ?
- Les images utilisent-elles `asset` ?
- Le rendu supporte-t-il l'absence partielle de contenu ?
- Les defaults sont-ils utiles sans etre trompeurs ?
- Les validations metier importantes sont-elles dans `validate` ?

## Erreurs frequentes

### 1. Mettre de la presentation dans `content`

Exemple moins bon:

```ts
defaultContent: {
  title: "Hello",
  titleColor: "#000",
}
```

Mieux:

```ts
defaultContent: {
  title: "Hello",
},
defaultSettings: {
  titleColor: "#000000",
}
```

### 2. Faire un seul field pour tout

Evite:

```ts
{ name: "config", type: "textarea", label: "Config JSON" }
```

sauf si c'est vraiment un bloc expert.

### 3. Renommer un `type` ou un `name` sans migration

Le JSON deja persiste depend de ces identifiants.

### 4. Oublier de penser a l'etat vide

Ton `render` doit survivre a:

- image absente
- liste vide
- texte optionnel
- bloc inconnu
