[English](README.md) · **Français**

# Sonnaille

Sonnaille aide les traileurs, vététistes et randonneurs à **préparer leur sortie** en territoire pastoral et à **signaler ce qu'ils ont vu après**. L'application montre les zones pastorales et les troupeaux prévus, croise un tracé GPX avec ces zones, et donne des conseils adaptés à la zone et à l'activité sur les troupeaux et les chiens de protection (patous).

Ce n'est pas un GPS. Sonnaille complète [Map Patou](https://www.pasto-kezako.fr/) : Map Patou dit où les troupeaux sont prévus, Sonnaille ajoute la préparation de sortie, les conseils et les observations de terrain.

## État

V0 en cours : une démo sur la Chartreuse et le Vercors. Voir le [backlog](docs/backlog.md).

## Documentation

- [Cahier des charges](docs/cahier-des-charges.md)
- [Backlog](docs/backlog.md)
- [Décisions](docs/decisions.md)
- [Sources de données](docs/sources.md) et [étude Map Patou](docs/map-patou.md)

## Développement

Nécessite Node.js 22.

```bash
npm install
npm run dev      # front Angular : http://localhost:4200/Sonnaille/
npm test         # tests unitaires, d'architecture et des composants Angular
npm run build    # build de production (dist/browser)
npm run data     # zones pastorales du jour depuis Map Patou (jamais versionnées)
```

- **Zones d'un autre jour** : `MAP_PATOU_DATE=2026-07-15 npm run data`, puis ouvrir `/Sonnaille/?date=2026-07-15`. Au plus une requête par jour est envoyée à Map Patou.
- **Observations de terrain** : « Signaler animaux, ruches ou nids », toucher la carte, dire ce qui a été vu (troupeau, ruches, nid de guêpes, d’abeilles ou de frelons), enregistrer : le signalement est gardé sur l'appareil (« Mes signalements »). « Publier » copie les entrées et ouvre l'éditeur GitHub de `public/content/observations.geojson` : les coller dans `features` et valider.
- **Zones en production** : un PC en France les publie chaque matin dans un dépôt privé lu par la CI, voir [donnees-zones.md](docs/donnees-zones.md).
- **Fonds de carte** : voir [fonds-de-carte.md](docs/fonds-de-carte.md), dont l'activation de la carte IGN 1:25 000 avec une clé IGN personnelle.
- **Démo** : [docs/demo](docs/demo/README.md), et en ligne sans API : [?demo](https://thony-crz.github.io/Sonnaille/?demo).
- **API des signalements V1** (.NET, en cours) : [api/](api/README.fr.md), `dotnet test` dans `api/` ; voir [api.md](docs/api.md).

## Conventions

- **TDD** : tout code de production commence par un test qui échoue.
- **Clean architecture** : `src/domain`, `src/application`, `src/infrastructure`, `src/ui` (carte MapLibre), et le front Angular 22 dans `src/app`, dont la racine de composition `src/app/app.config.ts` branche les adaptateurs. Un test dans `tests/architecture/` vérifie la règle de dépendance.
- **Langue** : le code en anglais ; la documentation et les textes de l'interface en français ; les README dans les deux langues.

Détails dans [decisions.md](docs/decisions.md) (D2, D3, D5).
