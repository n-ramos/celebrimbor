# Contribuer à Celebrimbor

Merci de l'intérêt que tu portes au projet ! Celebrimbor est un visual page
builder headless, agnostique du framework UI et sérialisable en JSON stable.
Ce guide explique comment proposer des changements proprement.

## Sommaire

- [Code de conduite](#code-de-conduite)
- [Prérequis](#prérequis)
- [Mise en route](#mise-en-route)
- [Architecture du monorepo](#architecture-du-monorepo)
- [Workflow de contribution](#workflow-de-contribution)
- [Conventions de code](#conventions-de-code)
- [Tests et qualité](#tests-et-qualité)
- [Messages de commit](#messages-de-commit)
- [Pull requests](#pull-requests)
- [Signaler un bug ou proposer une fonctionnalité](#signaler-un-bug-ou-proposer-une-fonctionnalité)
- [Licence](#licence)

## Code de conduite

Sois respectueux, constructif et patient. Les échanges (issues, PR, reviews)
doivent rester courtois et centrés sur le code. Tout comportement abusif peut
entraîner le refus d'une contribution.

## Prérequis

- **Node.js** ≥ 20
- **pnpm** `10.12.1` (la version est épinglée via `packageManager`)

Active pnpm via Corepack si besoin :

```bash
corepack enable
corepack prepare pnpm@10.12.1 --activate
```

## Mise en route

```bash
git clone https://github.com/n-ramos/celebrimbor.git
cd celebrimbor
pnpm install
pnpm build        # build de tous les packages
pnpm test         # suite de tests
```

Pour itérer sur l'éditeur React :

```bash
pnpm dev:playground-react
```

Pour explorer les composants en isolation :

```bash
pnpm storybook
```

## Architecture du monorepo

Le projet sépare strictement les couches. Garde cette séparation en tête : le
**cœur ne doit dépendre d'aucun framework UI ni d'aucun backend**.

```txt
packages/
  core/                      # types, document model, registry, validation, historique, rendu abstrait
  editor-react/              # builder React, canvas, inspector, SchemaForm
  editor-vue/                # éditeur Vue 3
  editor-element/            # custom element pour embarquer le builder
  blocks/basic/              # preset de blocs d'exemple
  adapters/
    local-storage/
    rest/
    laravel-filament/        # exemple d'intégration (aucun PHP dans le cœur)
apps/
  playground-react/          # bac à sable de dev
  embed/                     # bundle embarquable
```

Règles d'or :

- `core` ne dépend de **rien** côté UI (ni React, ni Vue, ni DOM spécifique).
- Toute logique métier réutilisable vit dans `core`, pas dans un éditeur.
- Le format JSON du document doit rester **stable et rétrocompatible**. Tout
  changement de schéma doit être discuté dans une issue au préalable.

## Workflow de contribution

1. **Ouvre une issue** avant tout changement non trivial pour valider l'approche.
2. **Fork** le dépôt (ou crée une branche si tu as les droits).
3. Crée une branche depuis `main` :
   ```bash
   git checkout -b feat/ma-fonctionnalite
   ```
4. Développe, ajoute des tests, documente.
5. Vérifie que tout passe en local (voir ci-dessous).
6. Ouvre une **pull request** vers `main`.

## Conventions de code

- **TypeScript** partout, en mode strict.
- Respecte le style du code environnant (nommage, densité de commentaires, idiomes).
- Pas d'`any` non justifié, pas de dépendance lourde ajoutée sans discussion.
- Documente les API publiques exportées par les packages.

Avant de pousser :

```bash
pnpm lint
pnpm typecheck
```

## Tests et qualité

Toute correction de bug ou nouvelle fonctionnalité doit être couverte par des
tests (Vitest).

```bash
pnpm test                # tous les packages
pnpm test:coverage       # avec couverture
```

Un changement ne sera pas mergé si la CI échoue.

## Messages de commit

Utilise le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat(core): ajoute la validation des blocs imbriqués
fix(editor-react): corrige le focus de l'inspecteur
docs: complète le guide d'intégration Laravel
chore(ci): met à jour le workflow de publication
```

Préfixes courants : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`,
`release`. Indique le package concerné entre parenthèses quand c'est pertinent.

## Pull requests

Une bonne PR :

- a une portée **ciblée** (une fonctionnalité / un fix à la fois) ;
- décrit le **quoi** et le **pourquoi**, et lie l'issue associée (`Closes #123`) ;
- passe `lint`, `typecheck`, `build` et `test` ;
- met à jour la documentation (`docs/`) si le comportement public change ;
- ne casse pas la rétrocompatibilité du JSON sans discussion explicite.

Les mainteneurs peuvent demander des ajustements avant le merge.

## Signaler un bug ou proposer une fonctionnalité

Ouvre une [issue](https://github.com/n-ramos/celebrimbor/issues) en précisant :

- **Bug** : version, étapes de reproduction, comportement attendu vs observé, et
  si possible un extrait de JSON ou un cas minimal.
- **Fonctionnalité** : le besoin, le cas d'usage, et l'impact éventuel sur le
  format du document.

## Licence

En contribuant, tu acceptes que tes contributions soient publiées sous la
licence [MIT](./LICENSE) du projet.
