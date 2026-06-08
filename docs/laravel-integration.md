# Integrer la lib dans Laravel

Ce guide explique comment utiliser le page builder dans un projet Laravel, y compris:

- la persistence backend
- l'integration Filament / Livewire
- la gestion des assets
- la preview
- les bonnes pratiques pour garder une architecture agnostique

Important:

- le core du page builder reste 100% TypeScript
- Laravel ne doit pas redefinir les blocs en PHP
- Laravel stocke et transporte le JSON, mais ne devient pas la source de verite sur la structure des blocs

## Philosophie d'integration

Le pattern recommande est:

1. les blocs et leurs fields sont definis en TypeScript
2. Laravel stocke un JSON brut (`document` ou format portable)
3. Filament ou un back-office Blade monte le web component ou le builder React
4. Laravel expose si besoin:
   - un endpoint de media picker
   - un endpoint de sauvegarde/publish
   - un endpoint de preview
5. le rendu final est assure par:
   - un frontend JS
   - un SSR Node
   - ou un service de preview dedie

Ce decouplage est volontaire:

- tu peux changer l'UI plus tard
- tu peux migrer le renderer sans changer le contenu
- tu peux utiliser la meme source JSON dans plusieurs frontends

## Ce que Laravel doit stocker

Le minimum utile ressemble a ceci:

```php
Schema::create('pages', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->string('status')->default('draft');
    $table->json('document');
    $table->timestamps();
});
```

Tu peux ajouter selon ton besoin:

- `site_id`
- `locale`
- `published_at`
- `seo` JSON
- `meta` JSON
- `author_id`
- `revision_id`

## Modele Eloquent recommande

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'status',
        'document',
    ];

    protected $casts = [
        'document' => 'array',
    ];
}
```

Points importants:

- caste `document` en `array`
- ne transforme pas la structure des blocs a la volee
- garde le JSON le plus brut possible

## Quel format stocker dans Laravel ?

Tu as deux options principales:

### Option 1: stocker le `PageDocument` complet

Bon choix si:

- tu veux garder `version`, `meta`, `id`, `title`
- tu veux travailler proche du model interne du core
- tu veux conserver une marge d'evolution plus large

Exemple:

```json
{
  "version": "1.0.0",
  "id": "home",
  "title": "Homepage",
  "blocks": [
    {
      "id": "hero-home",
      "type": "hero",
      "content": {
        "title": "Build visually"
      }
    }
  ]
}
```

### Option 2: stocker le format portable

Bon choix si:

- tu veux un payload plus simple a manipuler
- tu veux rapprocher Laravel d'un simple "block payload store"
- tu veux un format plus facile a reconsommer ailleurs

Exemple:

```json
[
  {
    "_name": "hero",
    "_id": "hero-home",
    "title": "Build visually"
  }
]
```

### Recommendation

En Laravel pur:

- `portable` est souvent le meilleur choix si ton backend ne fait que stocker
- `document` est souvent le meilleur choix si tu veux brancher plus de meta ou d'operations internes

## Filament: integration minimale

Le repo contient deja une base d'integration ici:

- [examples/laravel-filament/VisualPageBuilderField.php.example](/Users/nra/Documents/Celebrimbor/examples/laravel-filament/VisualPageBuilderField.php.example)
- [examples/laravel-filament/visual-page-builder-field.blade.php.example](/Users/nra/Documents/Celebrimbor/examples/laravel-filament/visual-page-builder-field.blade.php.example)
- [packages/adapters/laravel-filament/src/index.ts](/Users/nra/Documents/Celebrimbor/packages/adapters/laravel-filament/src/index.ts)

### Field PHP

Exemple:

```php
<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class VisualPageBuilderField extends Field
{
    protected string $view = 'filament.forms.components.visual-page-builder-field';

    public function blocksPreset(string $preset): static
    {
        return $this->extraAttributes([
            'data-blocks-preset' => $preset,
        ]);
    }
}
```

### Vue Blade

Exemple:

```blade
<x-dynamic-component
    :component="$getFieldWrapperView()"
    :field="$field"
>
    <div
        wire:ignore
        x-data
        x-init="
            window.dispatchEvent(new CustomEvent('my-page-builder:init', {
                detail: {
                    statePath: @js($getStatePath()),
                    value: @js($getState()),
                    preset: $el.dataset.blocksPreset,
                }
            }))
        "
        data-blocks-preset="{{ $getExtraAttributes()['data-blocks-preset'] ?? 'marketing' }}"
        class="min-h-[600px]"
    ></div>
</x-dynamic-component>
```

### Resource Filament

```php
use App\Filament\Forms\Components\VisualPageBuilderField;
use Filament\Forms;

Forms\Components\TextInput::make('title')
    ->required(),

Forms\Components\TextInput::make('slug')
    ->required(),

VisualPageBuilderField::make('document')
    ->blocksPreset('marketing')
    ->columnSpanFull(),
```

## Ce que fait le bridge Laravel fourni

Le package `@n-ramos/celebrimbor-adapter-laravel-filament` fournit deux briques:

### `createLaravelAssetPicker`

Permet de brancher un endpoint Laravel qui retourne un media.

### `mountFilamentBridge`

Permet de synchroniser le builder avec le canal de ton champ Filament / Livewire.

Exemple conceptuel:

```ts
import { mountFilamentBridge, createLaravelAssetPicker } from "@n-ramos/celebrimbor-adapter-laravel-filament";

const assetPicker = createLaravelAssetPicker({
  endpoint: "/admin/page-builder/assets/pick",
  headers: async () => ({
    "X-CSRF-TOKEN": document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "",
  }),
});

mountFilamentBridge({
  element,
  initialValue,
  onChange(document) {
    // push vers Livewire / Alpine / ton state manager
  },
  async onSave(document) {
    // optionnel: sauvegarde explicite
  },
});
```

## Champs custom dans l'editeur Filament

Les champs `custom` (voir [Fields et schemas](./fields-and-schemas.md#custom-fields))
sont rendus par des composants que tu fournis. Comme un composant ne peut pas
transiter par un attribut HTML, on l'enregistre **au moment ou le bundle definit
le web component**, via l'option `customFields` de `definePageBuilderElement` :

```ts
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { definePageBuilderElement } from "@n-ramos/celebrimbor-editor-element";
import type { CustomFieldRegistry } from "@n-ramos/celebrimbor-editor-react";
import { ColorSwatchField } from "./custom-fields/color-swatch";

const registry = registerBasicBlocks(createBlockRegistry());

const customFields: CustomFieldRegistry = {
  // la cle correspond au `component` declare dans le schema du field
  "color-swatch": ColorSwatchField,
};

definePageBuilderElement({ registry, customFields });
```

La cle du registre (`"color-swatch"`) doit correspondre au `component` declare
dans le schema du bloc :

```ts
{ name: "accent", type: "custom", label: "Accent", component: "color-swatch" }
```

Tu peux aussi assigner le registre apres coup sur une instance precise :

```ts
const el = document.querySelector("my-page-builder");
el.customFields = { "color-swatch": ColorSwatchField };
```

Si aucun composant n'est enregistre pour un `component`, l'editeur affiche un
avertissement a la place du champ (il ne plante pas). Les conteneurs `row` /
`tabs` et tous les champs primitifs ne demandent **aucune** configuration cote
hote : ils fonctionnent des que le bundle est charge.

> Le bundle d'exemple [`@n-ramos/celebrimbor-embed`](/Users/nra/Documents/Celebrimbor/apps/embed/src/main.ts)
> montre ce branchement (champ `accent` du bloc testimonial).

## Gestion des assets Laravel

Le field `asset` du builder attend un objet de cette forme:

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

Le bridge Laravel attend une reponse JSON de type:

```ts
type LaravelMediaPayload = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};
```

### Exemple de route media picker

```php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PageBuilderAssetController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/admin/page-builder/assets/pick', PageBuilderAssetController::class)
        ->name('admin.page-builder.assets.pick');
});
```

### Exemple de controller simple

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;

class PageBuilderAssetController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $media = Media::query()->latest()->first();

        if (! $media) {
            return response()->json(null);
        }

        return response()->json([
            'id' => (string) $media->getKey(),
            'url' => $media->getFullUrl(),
            'alt' => $media->alt,
            'width' => $media->width,
            'height' => $media->height,
        ]);
    }
}
```

Note:

- cet exemple retourne juste un media
- dans la vraie vie, tu ouvriras souvent une modale ou un browser media
- l'important est de finir par retourner un payload compatible `Asset`

## Sauvegarde backend

Tu peux persister le JSON:

- via le submit normal du formulaire Filament
- via un endpoint explicite appele par `onSave`

### Sauvegarde classique Filament

Le plus simple:

- Livewire synchronise `document`
- Filament persiste le champ comme n'importe quel autre champ JSON

### Sauvegarde explicite via `onSave`

Utile si tu veux:

- un bouton `Save` qui ecrit immediatement
- une gestion de brouillon custom
- du versioning
- un pipeline editorial

Exemple d'endpoint:

```php
Route::post('/admin/pages/{page}/builder/save', [PageBuilderSaveController::class, 'store'])
    ->middleware(['web', 'auth']);
```

Exemple de controller:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PageBuilderSaveController extends Controller
{
    public function store(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'document' => ['required', 'array'],
        ]);

        $page->update([
            'document' => $data['document'],
        ]);

        return response()->json([
            'saved' => true,
            'page_id' => $page->id,
        ]);
    }
}
```

## Preview: les bonnes strategies

La preview est le sujet le plus important cote Laravel, parce qu'il faut rester honnete sur un point:

- le repo ne fournit pas de renderer PHP natif des blocs
- la preview la plus fiable doit reposer sur le meme systeme de rendu que ta prod

En pratique, tu as 3 strategies principales.

### Strategie A: preview front-end JavaScript

C'est souvent la meilleure.

Principe:

1. Laravel stocke le JSON
2. un frontend React/Vue/Next/Nuxt consomme ce JSON
3. Laravel ouvre ou appelle une URL de preview

Exemple:

- `/admin/pages/12/preview-token/abc`
- qui redirige vers `https://front.example.com/preview/pages/12?token=abc`

Avantages:

- preview fidele au rendu final
- pas de duplication PHP
- pas de mapping de blocs en backend

### Strategie B: preview via endpoint JSON + frontend embarque

Principe:

1. Laravel expose un endpoint JSON
2. une page Blade embarque un mini frontend JS
3. ce frontend rend le document avec les memes blocs

Exemple de route:

```php
Route::get('/admin/pages/{page}/preview-data', function (Page $page) {
    return response()->json([
        'document' => $page->document,
    ]);
})->middleware(['web', 'auth']);
```

Tu peux ensuite monter un renderer React dans une page d'admin dediee.

### Strategie C: preview HTML server-side dediee

Possible, mais plus couteuse.

Principe:

- Laravel envoie le JSON a un service Node ou SSR
- ce service retourne du HTML de preview

Bon choix si:

- tu as deja un runtime SSR
- tu veux des previews HTML partageables
- tu veux capturer des screenshots ou generer du PDF

## Recommandation preview

Si ton but est la fiabilite:

- ne re-code pas les blocs en Blade ou en PHP
- garde un seul systeme de rendu JS
- fais de Laravel le gestionnaire de persistence et d'acces

Autrement dit:

- Laravel stocke
- le frontend rend
- la preview appelle le frontend

## Exemple de preview controller Laravel

Exemple simple pour emettre une URL de preview securisee:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class PagePreviewController extends Controller
{
    public function __invoke(Page $page): RedirectResponse
    {
        $token = Str::random(40);

        // A adapter: stocker le token, sa duree de vie, et les droits.

        return redirect()->away(
            config('services.frontend.preview_url')
            . '/pages/' . $page->id
            . '?token=' . $token
        );
    }
}
```

## Backend: validation minimale recommandee

Laravel ne doit pas essayer de comprendre toute la grammaire des blocs, mais il peut imposer quelques garde-fous:

- `document` doit etre un tableau ou un objet selon ton format
- taille max raisonnable
- statut de page valide
- autorisation d'acces

Exemple:

```php
$data = $request->validate([
    'title' => ['required', 'string', 'max:255'],
    'slug' => ['required', 'string', 'max:255'],
    'status' => ['required', 'in:draft,published'],
    'document' => ['required', 'array'],
]);
```

Si tu stockes le `PageDocument` complet, tu peux aussi valider:

```php
'document.version' => ['required', 'string'],
'document.blocks' => ['required', 'array'],
```

## Publication

Workflow recommande:

1. `draft`
2. preview
3. publish

Au moment de publier, tu peux:

- copier `document` vers une revision publiee
- incrementer une version
- invalider un cache frontend
- declencher une regeneration statique

## Cas frequent: frontend SSR / static site

Si ton site public est en Next.js, Nuxt ou autre:

- Laravel reste ton CMS editorial
- le frontend public consomme `document`
- la preview front appelle le meme renderer
- la publication invalide le cache ou relance le build

C'est probablement l'architecture la plus saine pour cette lib.

## Checklist d'integration Laravel

- Le JSON est-il stocke brut sans transformation destructive ?
- Le champ `document` est-il caste en `array` ?
- Les blocs sont-ils definis uniquement cote TypeScript ?
- L'asset picker Laravel retourne-t-il un payload compatible `Asset` ?
- La preview repose-t-elle sur le meme renderer que la prod ?
- Les endpoints de save / preview sont-ils proteges ?
- Le workflow draft / publish est-il clarifie ?
- Le frontend public sait-il consommer le format choisi (`document` ou `portable`) ?
