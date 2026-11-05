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
| `ui` | Carte MapLibre, écrans | `domain`, `application`, `ui`, bibliothèques |

`src/main.ts` est le point de composition : le seul fichier qui assemble adaptateurs, cas d'usage et interface.

**Vérification automatique**

- `tests/architecture/` contient un test qui parcourt `src/` et échoue si une couche manque ou si un import viole la règle (imports statiques, dynamiques et réexports). Exception : un fichier `*.test.ts` peut importer `vitest`.
- La CI lance les tests avant chaque build ; un test rouge bloque le déploiement.

**Conséquences**

- Turf.js, MapLibre et la lecture de GPX restent dans `infrastructure` ou `ui`. Le domaine manipule ses propres types (point, ligne, polygone) et l'infrastructure les convertit.
- La détection de traversée (T17) est découpée : la règle métier (zones actives à la date, observations de moins de 3 jours, marge) dans `domain`, le calcul géométrique derrière un port, implémenté avec Turf.js.
