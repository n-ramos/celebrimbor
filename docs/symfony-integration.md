# Integrer la lib dans Symfony

Ce guide explique comment brancher le page builder dans un projet Symfony via
**Symfony UX / Stimulus** et **AssetMapper / importmap**. Comme pour Laravel :

- le core du page builder reste 100% TypeScript ;
- Symfony stocke et transporte le JSON, il ne redefinit pas les blocs en PHP ;
- le dev branche **son** registre de blocs (son "systeme de builder JS").

Deux paquets jumeaux :

- **JS** : [`@n-ramos/celebrimbor-symfony`](../packages/adapters/symfony-ux/README.md)
  (dans ce monorepo) — controller Stimulus agnostique, `defineCelebrimbor`,
  `mountCelebrimborPreview`.
- **PHP** : `n-ramos/celebrimbor-bundle` (repo Composer separe) — contrat +
  trait Doctrine pour le modele, `PageBuilderType`, composant Twig, et un
  renderer Twig par bloc pour la preview.

## Installation

```bash
composer require n-ramos/celebrimbor-bundle
php bin/console importmap:require @n-ramos/celebrimbor-symfony
```

Le bundle requiert `symfony/twig-bundle` cote hote (le renderer s'appuie sur
Twig). Le controller Stimulus s'auto-enregistre via la cle `symfony` du
`package.json` du paquet npm.

## 1. Brancher ses blocs (JS)

Le paquet ne contient **aucun bloc**. Definis l'element une fois dans ton entry
AssetMapper (`assets/app.js`), avant que le controller Stimulus ne se connecte :

```js
import { defineCelebrimbor } from "@n-ramos/celebrimbor-symfony";
import "@n-ramos/celebrimbor-symfony/styles.css";
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";

const registry = createBlockRegistry();
// registry.register(monBlocHero); ...
defineCelebrimbor({ registry });
```

## 2. Le modele Doctrine

Implemente le contrat et utilise le trait. Le trait mappe une colonne JSON
`document` nullable et stocke le payload brut (pas de transformation
destructive). C'est l'equivalent Symfony de "interface + trait sur le model".

```php
use Doctrine\ORM\Mapping as ORM;
use NRamos\CelebrimborBundle\Concern\InteractsWithPageBuilderContent;
use NRamos\CelebrimborBundle\Contract\HasPageBuilderContent;

#[ORM\Entity]
class Page implements HasPageBuilderContent
{
    use InteractsWithPageBuilderContent;
    // ... id, title, slug, ...
}
```

Surcharge `pageBuilderFormat()` pour renvoyer `PageBuilderFormat::Document` si
tu stockes le `PageDocument` complet plutot que le format portable (defaut).

### Validation (optionnelle)

Pose la contrainte sur la propriete pour des garde-fous structurels (le bundle
ne comprend pas la grammaire des blocs, il verifie juste la sanite) :

```php
use NRamos\CelebrimborBundle\Validator\ValidPageDocument;

#[ValidPageDocument(maxBytes: 524288)]
#[ORM\Column(name: 'document', type: 'json', nullable: true)]
protected ?array $document = null;
```

## 3. Le formulaire

```php
use NRamos\CelebrimborBundle\Form\PageBuilderType;

$builder->add('document', PageBuilderType::class, [
    // 'format' => PageBuilderFormat::Document,
    'preview_url' => $this->generateUrl('admin_page_preview', ['id' => $page->getId()]),
]);
```

Le champ rend `<my-page-builder>` cable au controller `celebrimbor--page-builder`
et transforme le tableau du document en JSON (et inversement au submit). Le
theme de formulaire est auto-enregistre.

### Hors formulaire : composant Twig

Avec `symfony/ux-twig-component` installe :

```twig
<twig:Celebrimbor:PageBuilder
    :document="page.pageBuilderDocument"
    name="page[document]"
    previewUrl="{{ path('admin_page_preview', { id: page.id }) }}"
/>
```

## 4. La preview

Une preview = un controller qui appelle le bundle. Etends
`AbstractPreviewController` et ajoute une route :

```php
use NRamos\CelebrimborBundle\Preview\AbstractPreviewController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PagePreviewController extends AbstractPreviewController
{
    #[Route('/admin/pages/{id}/preview', name: 'admin_page_preview')]
    public function __invoke(Page $page): Response
    {
        return $this->renderPreview($page);        // A) Twig natif, 1 template/bloc
        // return $this->renderJsPreview($page);    // B) meme renderer JS que l'editeur
    }
}
```

### Strategie A : rendu Twig par bloc

Le service `CelebrimborRenderer` normalise le document (portable **ou**
`PageDocument`) puis rend chaque bloc via `<prefix>/<nom>.html.twig` (defaut
`blocks/`). Exemple `templates/blocks/hero.html.twig` :

```twig
<section class="hero">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
    {{ children }}
</section>
```

Chaque template recoit les `fields` du bloc etales au premier niveau, plus
`fields`, `settings`, `children` (deja rendu) et `block`. C'est l'equivalent
Twig du renderer Blade du plugin Filament : les blocs se rendent pareil des deux
cotes.

### Strategie B : preview JS fidele

Surcharge `templates/bundles/CelebrimborBundle/preview/js_preview.html.twig`
pour y deposer une entry AssetMapper qui appelle
`mountCelebrimborPreview({ registry })` avec le meme registre que l'editeur. La
preview utilise alors exactement le meme rendu que la production, sans
duplication PHP.

## Configuration

```yaml
# config/packages/celebrimbor.yaml
celebrimbor:
    default_format: portable          # portable | document
    blocks_template_prefix: blocks    # <prefix>/<bloc>.html.twig
    render_missing_comment: false     # commentaire HTML pour les blocs non mappes
```

## Checklist d'integration Symfony

- Les blocs sont-ils definis uniquement cote TypeScript (`defineCelebrimbor`) ?
- L'entite implemente-t-elle `HasPageBuilderContent` (trait + colonne `document`) ?
- Le JSON est-il stocke brut sans transformation destructive ?
- La preview repose-t-elle sur le meme renderer (Twig par bloc OU JS) que la prod ?
- Les routes de preview / save sont-elles protegees ?
- `symfony/twig-bundle` est-il bien present cote hote ?
