# Plugin Filament (Composer / Packagist)

Squelette d'un **plugin Filament publiable sur Packagist** qui embarque le bundle
de l'éditeur et fournit le champ `VisualPageBuilderField`. Objectif : côté hôte,

```bash
composer require n-ramos/celebrimbor-filament
php artisan filament:assets
```

…et c'est tout. **Pas de CDN, pas de copie manuelle** : le JS/CSS est versionné
avec le package Composer et servi par Filament.

> La définition des blocs reste **uniquement côté TypeScript**. Laravel ne stocke
> qu'un champ `document` JSON brut ; il n'a aucun schéma de bloc en PHP.

## Pourquoi un package Composer plutôt qu'un CDN ?

Le bundle [`@n-ramos/celebrimbor-embed`](../../apps/embed/README.md) est
distribuable de deux façons :

- **CDN** (`jsDelivr`/`unpkg`) — idéal pour un hôte HTML quelconque ou un proto,
  mais dépend d'un service externe et d'une URL versionnée à la main.
- **Package Composer** — pour Filament, c'est le bon modèle : le bundle est
  vendoré dans `resources/dist/`, enregistré via `FilamentAsset`, donc **hors-ligne,
  versionné avec le package, et publié par `php artisan filament:assets`**.

Ce dossier illustre la seconde voie.

## Layout du package

```
celebrimbor-filament/
├── composer.json                         (voir composer.json.example)
├── src/
│   ├── CelebrimborServiceProvider.php     (enregistre les assets via FilamentAsset)
│   └── Forms/Components/
│       └── VisualPageBuilderField.php     (le champ Filament)
└── resources/
    ├── dist/                              (bundle JS/CSS vendoré — voir ci-dessous)
    │   ├── celebrimbor.iife.js
    │   └── celebrimbor.css
    └── views/
        └── visual-page-builder-field.blade.php
```

Les fichiers `*.example` de ce dossier correspondent à ces emplacements.

## Vendorer le bundle dans le package

Le bundle est construit depuis ce monorepo puis copié dans `resources/dist/` du
package, **avant de tagger une release Composer** :

```bash
# dans le monorepo
pnpm --filter @n-ramos/celebrimbor-embed build
cp apps/embed/dist/celebrimbor.iife.js apps/embed/dist/celebrimbor.css \
   /chemin/vers/celebrimbor-filament/resources/dist/
```

(Ou via `build:laravel` en pointant un dossier de staging.) Comme l'asset vit
dans le package, sa version est celle du `composer require` — pas de dérive.

## Enregistrement des assets

`CelebrimborServiceProvider` (voir `CelebrimborServiceProvider.php.example`) fait :

```php
FilamentAsset::register([
    Js::make('celebrimbor', __DIR__ . '/../resources/dist/celebrimbor.iife.js'),
    Css::make('celebrimbor', __DIR__ . '/../resources/dist/celebrimbor.css'),
], package: 'n-ramos/celebrimbor-filament');
```

Filament copie alors ces fichiers vers `public/js|css/...` (hash de version
inclus) au `php artisan filament:assets`, et les injecte sur ses pages.

## Utilisation dans une Resource

```php
use NRamos\Celebrimbor\Filament\Forms\Components\VisualPageBuilderField;
use Filament\Forms;

Forms\Components\TextInput::make('title')->required(),
Forms\Components\TextInput::make('slug')->required(),

VisualPageBuilderField::make('document')
    ->documentFormat('portable') // ou 'document'
    ->columnSpanFull(),
```

Le champ rend l'élément `<my-page-builder>` (voir le blade), qui synchronise un
`<textarea name="document">` caché : Livewire/Filament récupère la valeur au
submit comme n'importe quel champ JSON.

## Table `pages`

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

## Pour aller plus loin

- [Guide Laravel complet](../../docs/laravel-integration.md) — persistence, media picker, preview, publication.
- [Monter l'éditeur dans Filament](../../docs/laravel-integration.md#monter-lediteur-dans-filament) — les options de chargement (Composer / CDN / self-host).
- [Champs custom dans l'éditeur Filament](../../docs/laravel-integration.md#champs-custom-dans-lediteur-filament) — registre `customFields` (configuré dans le `main.ts` du bundle).
- `packages/adapters/laravel-filament/src/index.ts` — bridge JS optionnel (media picker Laravel, canal Livewire).
