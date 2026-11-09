# Décisions

Journal des décisions techniques. Les décisions de produit se trouvent dans le [cahier des charges](cahier-des-charges.md).

## D1 — Les données Map Patou restent hors du dépôt (T04)

5 novembre 2026 · Statut : adoptée

**Contexte**

Le dépôt `Thony-Crz/Sonnaille` est public (vérifié le 5 novembre 2026). La V0 utilise les données de Map Patou récupérées par scraping, sans accord du Réseau Pastoral AuRA pour l'instant (voir [map-patou.md](map-patou.md)). Les committer dans un dépôt public reviendrait à les republier, ce qui transformerait une démo tolérable en réutilisation non autorisée.

Option écartée : un dépôt privé avec GitHub Pages, qui demande un abonnement payant.

**Décision**

Le code reste public. Les données Map Patou ne sont jamais committées.

- **Récupération à la construction** : GitHub Actions appelle l'API Map Patou pendant la construction du site, découpe la réponse sur la Chartreuse et le Vercors, et l'écrit directement dans le site construit.
- **Déploiement par artefact** : le site est publié avec `actions/upload-pages-artifact` et `actions/deploy-pages`. Pas de branche `gh-pages`, qui serait elle aussi publique et contiendrait les données.
- **`.gitignore`** : le dossier local des données Map Patou est ignoré, pour éviter un commit par erreur depuis un poste de développement.
- **Journaux** : le workflow n'affiche jamais le contenu des données dans ses logs, qui sont publics pour un dépôt public.
- **Fréquence** : une construction planifiée par jour pendant la saison d'estive (juin à octobre), plus les constructions déclenchées par un push.
- **En cas d'échec de l'API** : la construction échoue, et GitHub Pages continue de servir le dernier déploiement réussi.
- **Discrétion du site** : `robots.txt` interdit l'indexation, chaque page porte `<meta name="robots" content="noindex">`, et aucun lien vers le site n'apparaît dans le README ni ailleurs, tant que le Réseau Pastoral AuRA n'a pas répondu.

**Conséquences**

- Les données restent accessibles à qui connaît l'adresse du site. C'est un risque accepté pour la durée de la démo.
- En développement local, un script récupère les données dans le dossier ignoré, avec la même limite d'une requête par jour.
- Dès qu'un accord ou un export officiel existe (T03), cette décision est revue : les données pourront être versionnées si la licence le permet.

## D2 — TDD et clean architecture

5 novembre 2026 · Statut : adoptée

**Décision**

- **TDD** : tout code de production naît d'un test qui échoue. Cycle rouge, vert, refactor. Un test ne se modifie pas pour faire passer du code.
- **Clean architecture** : le code de `src/` est rangé en quatre couches. Chaque couche ne dépend que des couches plus internes.

| Couche | Rôle | Peut dépendre de |
| --- | --- | --- |
| `domain` | Entités et règles métier pures | `domain` seulement, aucune bibliothèque |
| `application` | Cas d'usage et ports (interfaces) | `domain`, `application`, aucune bibliothèque |
| `infrastructure` | Adaptateurs : GeoJSON, Map Patou, GPX, Turf.js, stockage | `domain`, `application`, `infrastructure`, bibliothèques |
| `ui` | Carte MapLibre, fonds, pictogrammes, libellés | `domain`, `application`, `ui`, bibliothèques |
| `app` | Front Angular (D5) : composants, store | `domain`, `application`, `ui`, `app`, bibliothèques |

`src/app/app.config.ts` est le point de composition : le seul fichier qui assemble adaptateurs, cas d'usage et interface (révision du 9 novembre 2026, D5 ; avant, `src/main.ts`).

**Vérification automatique**

- `tests/architecture/` contient un test qui parcourt `src/` et échoue si une couche manque ou si un import viole la règle (imports statiques, dynamiques et réexports). Exception : un fichier `*.test.ts` peut importer `vitest`.
- La CI lance les tests avant chaque build ; un test rouge bloque le déploiement.

**Conséquences**

- Turf.js, MapLibre et la lecture de GPX restent dans `infrastructure` ou `ui`. Le domaine manipule ses propres types (point, ligne, polygone) et l'infrastructure les convertit.
- La détection de traversée (T17) est entièrement dans `domain`, en TypeScript pur, sans Turf.js : point dans un polygone (avec trous), distance au contour par projection locale, tracé échantillonné tous les 10 m. Ces trois opérations suffisent, restent rapides à l'échelle d'une sortie et sont testées directement. Révision du 5 novembre 2026 : la première version prévoyait Turf.js derrière un port.

## D3 — Langues : code en anglais, README bilingues

5 novembre 2026 · Statut : adoptée

**Décision**

| Élément | Langue |
| --- | --- |
| Code : identifiants, noms de fichiers, commentaires, descriptions de tests, messages d'erreur techniques, workflows | Anglais |
| Textes affichés aux utilisateurs (interface, attributions, libellés d'accessibilité) | Français |
| Documents de `docs/` | Français |
| README (racine et couches) | Les deux : `README.md` en anglais, `README.fr.md` en français, avec un lien en tête de chacun pour passer de l'un à l'autre |
| Messages de commit | Français |

**Conséquences**

- Le vocabulaire métier a une traduction fixe dans le code : emprise → `Bounds`, territoire → `territory`, massif → `Massif`, zone pastorale → `PastoralZone`, secteur prévu → `PlannedSector`, observation → `Observation`, conseil → `Advice`, tracé → `Track`, sortie → `Outing`.
- Tout README modifié l'est dans les deux langues, dans le même commit.

## D4 — L'API Map Patou n'est pas joignable depuis la CI

5 novembre 2026 · Statut : adoptée, provisoire

**Constat**

Depuis les serveurs de GitHub Actions, la connexion à `mappatous-api.lessem.inrae.fr` échoue (`UND_ERR_CONNECT_TIMEOUT`), alors que la même requête fonctionne depuis un poste en France. L'API filtre vraisemblablement les adresses des hébergeurs.

**Décision**

- L'étape `npm run data` de la CI n'est plus bloquante : sans données, le site se déploie quand même et l'application indique que les zones sont indisponibles.
- En développement, `npm run data` fonctionne depuis le poste local (`MAP_PATOU_DATE=2026-07-15` pour un jour d'été).
- Le reste de D1 tient toujours : données jamais versionnées dans le dépôt public, au plus une requête par jour.

**Pistes pour avoir les zones en production** (à trancher, par ordre de préférence)

1. Un accès officiel accordé par le Réseau Pastoral AuRA (T03), éventuellement avec un export que la CI peut lire.
2. Un dépôt privé de données, alimenté depuis le poste d'Anthony par `npm run data`, que la CI lit avec un jeton.
3. Un runner GitHub auto-hébergé sur un poste en France.

**Remplacée par D6** (9 novembre 2026) : les zones ne passent plus par la CI.

## D5 — Le front passe en Angular (9 novembre 2026)

**Contexte** : le front était écrit en TypeScript sans framework (Vite, fonctions qui créent le DOM, orchestration dans `src/main.ts`). Anthony a demandé de le transformer en Angular.

**Décision**

- Angular 22, composants autonomes, `OnPush` et signals, sans zone.js. Build et tests par la CLI Angular (`@angular/build`), tests des composants sous Vitest (`ng test`).
- Seule l'interface change : `domain`, `application` et `infrastructure` sont repris tels quels. Le front Angular (`src/app`) est une couche de plus, qui ne parle qu'à l'application et aux ports.
- Les ports sont fournis par des jetons d'injection (`src/app/tokens.ts`) ; `src/app/app.config.ts` est la racine de composition, seul fichier de `src/app` autorisé à importer l'infrastructure (vérifié par `tests/architecture`).
- L'orchestration de `src/main.ts` devient un store injectable à base de signals (`SonnailleStore`), testé avec de faux ports et une fausse carte.
- Les composants sont « de présentation » (entrées et sorties seulement) ; l'app les branche sur le store.
- La carte MapLibre reste un adaptateur sans framework (`src/ui/maplibre-map-view.ts`), créé par une fabrique injectée : le composant carte se teste sans WebGL.
- Hors ligne : le service worker d'Angular (`ngsw-config.json`) remplace Workbox, avec les mêmes règles ; `public/sw.js` désinstalle l'ancien service worker chez ceux qui l'avaient.
- Valeurs de build (clé IGN, adresse de l'API) : `ng build --define`, à la place des variables `VITE_`.
- Angular 22 demande TypeScript 6.0 : le projet est passé de TypeScript 7 à 6.0.

**Conséquences** : la migration s'est faite par étapes, l'app Vite restant déployée jusqu'à ce que le front Angular fasse tout ce qu'elle faisait ; les tests des anciennes fonctions DOM ont été portés en tests de composants.

## D6 — Les zones vont en base, récupérées par le serveur (9 novembre 2026)

**Contexte** : D4 laissait le site sans zones en production. Une solution d'attente (un PC qui publie les zones chaque matin dans un dépôt GitHub privé) a été écrite puis annulée par Anthony : les données n'ont rien à faire dans un dépôt, même privé, et aucun processus ne doit tourner sur un poste.

**Décision**

- L'API .NET récupère elle-même les zones chez Map Patou, au plus une fois par jour (heure de Paris), et les garde dans PostGIS (`pastoral_zones`, `zone_dataset`). Les zones précédentes restent servies si Map Patou échoue.
- Le site les lit à `GET /api/zones`, au format qu'il lisait déjà ; plus de zones dans le build, plus de reconstruction quotidienne du site.
- `npm run data` reste pour le développement (fichier local, jamais versionné).
- Rien sur un poste personnel, aucune donnée Map Patou dans un dépôt Git (D1).

**Conséquences**

- Tant que l'API n'est pas hébergée, le site en ligne n'a pas de zones réelles (le mode démo reste disponible).
- L'hébergeur doit pouvoir joindre Map Patou : à tester avant de le choisir ([hebergement.md](hebergement.md)).
- Le réglage du site devient `SONNAILLE_API_URL` (zones et signalements).
