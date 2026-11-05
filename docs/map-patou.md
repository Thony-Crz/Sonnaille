# Map Patou — étude des données (T02)

Étude du 5 novembre 2026. Deux requêtes seulement ont été envoyées à l'API. Ce qui a été **vérifié** est séparé de ce qui reste **à confirmer**.

## En bref

- **Une seule requête suffit** : un `POST` sans authentification renvoie en GeoJSON tous les alpages d'Auvergne-Rhône-Alpes (5 233 quartiers), avec leurs contours et, pour la date demandée, les dates de présence, l'espèce et la présence de chiens.
- **La Chartreuse et le Vercors sont couverts** : en plein été, la moitié environ des quartiers sont renseignés comme en usage, et environ un quart ont des chiens de protection.
- **Les contours sont aussi la « zone large »** : la réponse contient tous les quartiers, en usage ou non. Map Patou fournit donc à la fois la zone pastorale et le secteur prévu.
- **Aucune donnée personnelle** n'apparaît dans la réponse.
- **Aucune condition de réutilisation n'est publiée.** En revanche, Visorando affiche les données de Map Patou depuis juillet 2026 : un canal de réutilisation existe donc.

## Accès (vérifié)

| Élément | Valeur |
| --- | --- |
| Carte publique | `https://mappatous.lessem.inrae.fr/` (page `/frame`, intégrée au site Pasto Kézako) |
| Endpoint | `POST https://mappatous-api.lessem.inrae.fr/api/v1/map/geojson` |
| Corps de la requête | `{"date": "2026-07-15T10:00:00.000Z"}` (date ISO) |
| Authentification | Aucune |
| Réponse | `{"success": true, "data": <FeatureCollection>, "message": "success"}`, environ 4,9 Mo |
| Fonds de carte utilisés | Plan IGN en tuiles vectorielles (`data.geopf.fr/tms/1.0.0/PLAN.IGN`) et image satellite SPOT 2023 en WMTS, sans clé |

Le même laboratoire expose aussi une API publique paginée des logements pastoraux (`https://logements-pastoraux-api.lessem.inrae.fr/api/v1/logements/public`), chargée par la carte. Piste pour la couche « cabanes », non étudiée.

## Structure des données (vérifié)

- 5 233 entités, toutes en `MultiPolygon`. Deux ont une géométrie vide.
- Identifiants de la forme `UP7325726_Q01` (5 118 entités) ou `ZP…_Q01` (115). *À confirmer* : `UP` désignerait une unité pastorale et `ZP` une zone pastorale, au sens de l'Enquête pastorale ; `Q01` un quartier ; les chiffres, le code de la commune.
- Départements présents (d'après l'identifiant) : 15, 74, 73, 63, 38, 26, 01, 05, 43, 42, 07.

| Champ | Contenu | Remarque |
| --- | --- | --- |
| `id` | Identifiant du quartier | Stable a priori, à confirmer |
| `nom` | Nom de l'unité | |
| `surface` | Nom du quartier | |
| `type_animal` | Espèce | Texte libre, casse irrégulière (`bovins`, `Bovins`, `Ovins Caprins`, `mixte`…), `null` si non renseigné : à normaliser |
| `chiens` | Présence de chiens de protection | Booléen |
| `debut`, `fin` | Période de présence | `null` si le quartier n'est pas en usage à la date demandée |
| `lundi` … `dimanche` | Jours de présence | `true` ou `null` |

Exemple d'objet (propriétés seulement) :

```json
{"id": "UP7325726_Q01", "nom": "ST MARCEL", "surface": "LES CARRIOTS", "type_animal": "ovins",
 "chiens": true, "debut": "2026-10-01", "fin": "2026-11-20",
 "lundi": true, "mardi": true, "mercredi": true, "jeudi": true, "vendredi": true, "samedi": true, "dimanche": true}
```

## Couverture selon la date (vérifié)

Massifs comptés par une boîte englobante approximative (centre du polygone dans la boîte). Les chiffres sont des ordres de grandeur.

| Date demandée | Toute la région : en usage | Toute la région : avec chiens | Chartreuse (42 quartiers) | Vercors (146 quartiers) |
| --- | --- | --- | --- | --- |
| 5 novembre 2026 | 353 | 66 | 0 en usage | 1 en usage, 0 avec chiens |
| 15 juillet 2026 | 4 692 | 561 | 32 en usage, 12 avec chiens | 85 en usage, 41 avec chiens |

La carte affiche d'ailleurs « 66 quartiers avec un ou plusieurs chiens de protection » au 5 novembre, ce qui confirme le filtrage par date.

## Cadre juridique

| Point | Constat |
| --- | --- |
| Mentions légales, conditions d'utilisation, licence | Aucune trouvée sur la carte |
| `robots.txt` | Non trouvé |
| Politique de confidentialité (avril 2024) | Responsable : Réseau Pastoral AuRA ; hébergement INRAE ; rien sur la réutilisation des données de la carte |
| Réutilisation existante | Visorando affiche un calque « Troupeaux / Chiens de protection » issu de Map Patou depuis juillet 2026, sur 9 départements ; l'article ne précise pas les conditions ([source](https://www.visorando.com/actus/une-nouvelle-information-pour-mieux-prep.html)) |

**Conséquence** : la réutilisation par Visorando montre que le Réseau Pastoral AuRA partage ses données. Le mail au responsable (T03) peut demander les mêmes conditions que Visorando.

## Recommandations pour le scraper (T12)

- **Une requête par jour au maximum**, avec la date du jour, uniquement en période d'estive.
- **Découper la réponse sur les deux massifs** avant de l'enregistrer : 4,9 Mo pour la région, beaucoup moins pour la Chartreuse et le Vercors.
- **Normaliser** `type_animal` (minuscules, espèces séparées) et écarter les géométries vides.
- **Séparer deux sorties** : les contours de tous les quartiers (zone large, change rarement) et les présences du jour (secteurs prévus).
- **Isoler le module** pour le remplacer par un accès officiel.
- **Ne pas publier** les données brutes dans un dépôt public (voir T04).

## À confirmer

- Ce que l'API renvoie pour une **date future** (préparer une sortie dans une semaine). Non testé.
- La signification exacte des identifiants `UP`, `ZP` et `Q`.
- La **fréquence de mise à jour** des calendriers par les éleveurs et les contributeurs.
- Les **conditions** dans lesquelles Visorando réutilise les données.
