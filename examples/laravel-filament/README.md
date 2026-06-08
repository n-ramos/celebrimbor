# Laravel / Filament Example

Cet exemple montre comment Laravel et Filament consomment le builder JavaScript sans imposer de schéma PHP pour les blocs.

Pour la documentation complete Laravel:

- [Guide Laravel complet](../../docs/laravel-integration.md)
- [Portable JSON et web component](../../docs/portable-json-and-web-component.md)

## Principe

- Laravel stocke un champ `document` JSON brut
- Filament monte un composant custom qui charge le bundle JS
- la définition des blocs reste uniquement côté TypeScript
- Livewire synchronise la valeur JSON du document

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

## Filament Resource

```php
Forms\Components\TextInput::make('title')->required(),

Forms\Components\TextInput::make('slug')->required(),

VisualPageBuilderField::make('document')
    ->blocksPreset('marketing')
    ->columnSpanFull(),
```

## Attentes côté Field

- charger le bundle de `@n-ramos/celebrimbor-editor-react`
- injecter le JSON initial
- écouter `onChange`
- pousser les mises à jour vers Livewire
- brancher un asset picker Laravel pour les médias
- (optionnel) enregistrer des champs `custom` via `customFields` au `definePageBuilderElement` — voir [Champs custom dans l'editeur Filament](../../docs/laravel-integration.md#champs-custom-dans-lediteur-filament)

Voir aussi `packages/adapters/laravel-filament/src/index.ts` pour le bridge JavaScript.
