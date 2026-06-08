# Architecture Summary

Le monorepo implémente un page builder headless en TypeScript strict avec :

- un `core` sans dépendance UI ni backend
- un éditeur React séparé
- un preset de blocs marketing
- des adapters `localStorage`, `REST` et `Laravel/Filament`
- un playground React de démonstration

Vérifications exécutées :

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Points clés :

- le document est versionné et sérialisable
- les blocs inconnus sont préservés
- les opérations de document sont immutables
- Laravel/Filament reste un consommateur du bundle JS, jamais une dépendance du cœur
