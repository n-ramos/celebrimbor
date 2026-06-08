# Documentation

Cette documentation couvre la partie developpeur du page builder:

- model de document
- definition de blocs
- systeme de fields et de schemas
- fields repeatables (`array`)
- sortie JSON portable
- integration via web component

## Index

1. [Vue d'ensemble](./README.md)
2. [API du coeur](./core-api.md)
3. [Fields et schemas](./fields-and-schemas.md)
4. [Creer un bloc](./creating-blocks.md)
5. [Portable JSON et web component](./portable-json-and-web-component.md)
6. [Integrer la lib dans Laravel](./laravel-integration.md)
7. [Editeur Vue](./vue-integration.md)
8. [Analyse et recommandations](./analysis-and-recommendations.md)

## Parcours recommande

Si tu decouvres le projet:

1. Lis le `README.md` racine pour comprendre l'architecture globale.
2. Lis [Fields et schemas](./fields-and-schemas.md) pour comprendre comment modeler du contenu editable.
3. Lis [Creer un bloc](./creating-blocks.md) pour construire tes propres blocs.
4. Lis [Portable JSON et web component](./portable-json-and-web-component.md) pour exposer le builder hors React et conserver un format agnostique.
5. Lis [Integrer la lib dans Laravel](./laravel-integration.md) si ton back-office ou ton CMS tourne sur Laravel / Filament.

## Packages concernes

- `@n-ramos/celebrimbor-core`
  Types, document model, registry, operations, serialization.
- `@n-ramos/celebrimbor-editor-react`
  Builder React, sidebar, preview, `SchemaForm`, renderer.
- `@n-ramos/celebrimbor-editor-element`
  Emballage web component pour embarquer le builder dans n'importe quelle page HTML.
- `@n-ramos/celebrimbor-blocks-basic`
  Exemples de blocs concrets a relire avant de creer ta propre librairie.
