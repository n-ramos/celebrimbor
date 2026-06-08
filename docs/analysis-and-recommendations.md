# Analyse technique et recommandations

Revue agnostique du monorepo `my-page-builder` : architecture, qualite TypeScript, documentation, couverture de tests et axes d'amelioration. Date de revue : 2026-06-08.

## 1. Synthese

Le projet est une base **solide et bien pensee**. La separation headless `core` / rendu (`editor-react`, `editor-element`) / blocs (`blocks-basic`) / persistence (`adapters`) est nette et respecte la promesse d'agnosticisme : le coeur n'importe ni React, ni Vue, ni DOM, ni Laravel. Les operations sont immutables, le format de document est versionne et serialisable, et un format portable a plat permet l'interop avec des back-offices heterogenes.

Les principaux manques avant cette revue : **couverture de tests tres faible** (5 tests, 2 packages sur 9) et quelques **incoherences doc/code** + **pieges silencieux** dans le coeur.

## 2. Points forts

- **Frontiere agnostique respectee.** `core` est pur TypeScript, `tsconfig` strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Immutabilite systematique.** `structuredClone` partout, operations sans effet de bord, historique undo/redo isole.
- **Extensibilite.** Registry avec lazy-loading, `unknownBlockFactory` (les blocs inconnus survivent sans perte), rendu abstrait parametre par une `strategy`.
- **Contrats de persistence propres.** `PageBuilderStorage` minimal (`load`/`save` + `publish`/`preview` optionnels), adapters interchangeables.
- **DX.** `SchemaForm` pilote par schema, blocs auto-documentes par leurs `fields`.

## 3. Bugs et pieges identifies

### 3.1 `moveBlock` regenerait l'id du bloc deplace *(corrige)*

`moveBlock` clonait via `duplicateBlockNode`, qui reassigne un nouvel id au bloc **et a tous ses descendants**. Deplacer un bloc cassait donc la selection, les references externes et l'historique. Corrige : le deplacement clone desormais sans regenerer les ids (identite preservee). Couvert par `operations.test.ts`.

### 3.2 Collisions de cles dans le format portable *(documente)*

`serializePortableDocument` aplatit le contenu au meme niveau que `_name`/`_id`/`_settings`/`_visible`/`_children`. Un champ de contenu nomme `_name` ecrase le type du bloc (le spread du contenu suit les cles reservees). Round-trip non garanti dans ce cas. Documente dans `portable-json-and-web-component.md` et capture par un test dans `serialize.test.ts`.
*Amelioration possible* : namespacer le contenu (ex. `_props: {...}`) ou prefixer/echapper les cles reservees rencontrees.

### 3.3 `validateDocument` aveugle aux types inconnus quand une `unknownFactory` est definie *(documente)*

`validateDocument` utilise `registry.get`, qui renvoie la definition de repli pour un type inconnu. Avec une `unknownFactory` configuree (schema vide), les blocs inconnus passent comme valides au lieu d'emettre `unknown_block`.
*Amelioration possible* : distinguer `get` (avec repli) d'un acces strict, ou marquer la definition `unknown: true` et emettre un warning de validation dedie.

### 3.4 Code mort / duplication

`insertBlockAtPath` (exporte depuis `tree.ts`) n'est pas utilise par `operations.ts`, qui reimplemente sa propre insertion (`insertAtIndex`). A consolider pour eviter la divergence.

### 3.5 `mapBlocks` force `children: undefined`

`mapBlocks` ecrit explicitement `children: undefined` sur les feuilles, ce qui ajoute une cle indesirable au lieu de l'omettre. Cosmetique mais incoherent avec le reste du modele (qui compacte les optionnels).

## 4. Qualite TypeScript

- `BlockDefinition`, `RenderNode`, `BlockRenderer` reposent sur `any` (via un `BivariantCallback` pour la covariance). Choix pragmatique pour rester agnostique, mais on perd l'inference cote consommateur.
  *Piste* : exposer des helpers generiques `defineBlock<TContent, TSettings>` deja typeurs (c'est partiellement le cas) et eviter `any` dans `RenderNode` au profit de generiques propagables.
- `BlockSchema.zodSchema` est type `unknown` puis re-verifie a l'execution (`instanceof z.ZodType`). Acceptable, mais un type `ZodTypeAny` optionnel ameliorerait l'autocompletion.

## 5. Documentation

Corrections appliquees :

- README : `editor-vue` est un **stub de roadmap**, pas une couche fonctionnelle (l'arborescence le laissait croire). Annote.
- README : ajout d'une section **Tests** et **Limitations connues**.
- Nouvelle reference **`core-api.md`** : la doc ne couvrait pas `operations`, `history`, `events`, `validation`, `renderDocument`, `migrations`.
- `portable-json-and-web-component.md` : ajout de la limitation **collisions de cles**.

Restant a verifier/ameliorer :

- `apps/playground-vue` est un placeholder : preciser son statut dans sa propre doc.
- Documenter la semantique exacte d'index de `moveBlock` (post-suppression) dans le guide editeur.

## 6. Couverture de tests (apres revue)

Ajout de ~100 tests :

- `core` : `tree`, `operations`, `history`, `events`, `migrations`, `registry`, `validation`, `serialize`, `renderer`.
- `adapters` : `local-storage`, `rest` (fetch mocke), `laravel-filament`.
- `blocks-basic` : contrat « defaults valides vis-a-vis du schema » pour chaque bloc livre.
- `editor-element` : parsing/serialisation portable vs document, sync du textarea cache, idempotence de `definePageBuilderElement`.

Manques restants (recommande) :

- `editor-react` : seulement un smoke test. Couvrir `usePageBuilder` (selection controlee/non controlee, add/insert/remove/duplicate/move, etat `saving`), `SchemaForm` (rendu par type de field, repeatables), drag & drop.
- Tests de rendu des blocs (`render`) via `@testing-library/react`.
- Tests d'integration document complet (edition -> portable -> rehydratation -> rendu).

## 7. Recommandations priorisees

| Priorite | Action | Statut |
| --- | --- | --- |
| Haute | Couvrir `usePageBuilder` et `SchemaForm` (coeur de l'UX editeur) | ✅ Fait |
| Haute | Resoudre les collisions de cles portable (echappement reversible) | ✅ Fait |
| Moyenne | Strategie claire pour les blocs inconnus en validation (severite `warning`) | ✅ Fait |
| Moyenne | Consolider `insertBlockAtPath` vs `insertAtIndex` (supprimer la duplication) | ✅ Fait |
| Moyenne | CI : `pnpm typecheck && pnpm test && pnpm build` sur chaque PR | ✅ Fait (`.github/workflows/ci.yml`) |
| Basse | Reduire `any` dans `RenderNode`/`BlockRenderer` | ✅ Fait (defaults `unknown`) |
| Basse | Clarifier le statut `editor-vue` / `playground-vue` | ✅ Fait |
| Basse | Couverture chiffree (`vitest --coverage` + `@vitest/coverage-v8`) | ✅ Fait (`pnpm test:coverage`, etape CI) |
| Basse | Tests de rendu des blocs `render` React | ✅ Fait (`blocks-basic/tests/render.test.tsx`) |

## 8. Idees d'evolution produit

| Evolution | Statut |
| --- | --- |
| **Schema -> Zod automatique** (`schemaToZod`, source unique de verite) | ✅ Fait |
| **Validation a la frappe** dans `SchemaForm` (issues affichees sous les champs) | ✅ Fait |
| **Renderer HTML headless** dans `core` (`renderDocumentToHtml`, sans React/DOM) | ✅ Fait |
| **Presets de documents / templates** (`defineTemplate`, `createTemplateRegistry`) | ✅ Fait |
| **Marketplace de blocs** (`registerBlockManifest`, `createBlockCatalog`) | ✅ Fait |
| **Editeur Vue** fonctionnel (composable, `SchemaForm`, `PageBuilder`, `PageRenderer`) | ✅ Fait (minimal, sans DnD/WYSIWYG) |
| **Collaboration / autosave / presence** (Yjs) | Roadmap |
