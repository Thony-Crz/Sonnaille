[English](README.md) · **Français**

# app

Le front Angular 22 (décision D5) : composants autonomes, `OnPush`, signals, sans zone.js.

- `app.config.ts` : racine de composition. Elle fournit les adaptateurs de `src/infrastructure` derrière les ports (jetons d'injection dans `tokens.ts`) ; seul fichier de `src/app` autorisé à importer l'infrastructure.
- `sonnaille.store.ts` : l'état et ce que l'utilisateur peut faire, avec des signals. Il n'appelle que les cas d'usage de `application` et les ports.
- `map/` : la carte, créée par une fabrique injectée (MapLibre dans l'app, une fausse carte dans les tests).
- `panels/`, `sightings/`, `sheets/` : composants de présentation (entrées et sorties seulement), branchés sur le store par `app.ts`.
- `testing/` : faux ports et fausse carte pour les tests.

```bash
npm run dev            # http://localhost:4200/Sonnaille/
npm run test:angular   # tests des composants (src/app/**/*.spec.ts)
```
