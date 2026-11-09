# API de Sonnaille (V1)

L'API sert deux choses :

- **les zones pastorales du jour** : elle les récupère elle-même chez Map Patou, au plus une fois par jour, et les garde en base (décision D6) ;
- **les signalements** : en V0 ils restent sur le téléphone puis sont publiés à la main dans `public/content/observations.geojson` ; la V1 les reçoit, les fait valider par un modérateur, et ne publie que ceux qui sont validés.

## Architecture

ASP.NET Core (.NET 10) dans `api/`, en clean architecture, comme l'app web :

| Projet | Rôle | Dépend de |
|---|---|---|
| `Sonnaille.Domain` | Règles d'un signalement (troupeau ou nid, coordonnées, champs autorisés) ; zones pastorales, présences, emprise du territoire | rien |
| `Sonnaille.Application` | Cas d'usage : déposer, valider, lister les signalements ; rafraîchir les zones du jour ; ports `ISightingRepository`, `IZoneRepository`, `IMapPatou` | Domain |
| `Sonnaille.Infrastructure` | Adaptateurs : client Map Patou, stockage PostgreSQL et PostGIS, ou en mémoire | Application |
| `Sonnaille.Api` | Endpoints HTTP, lecture et écriture du GeoJSON, rafraîchissement des zones en tâche de fond, racine de composition | Application, Infrastructure |

Un test d'architecture (`ArchitectureTests`) vérifie ces dépendances. Tout est écrit en TDD (`dotnet test` dans `api/`, lancé par la CI).

## Zones pastorales

| Méthode | Chemin | Accès | Réponse |
|---|---|---|---|
| `GET` | `/api/zones` | public | `FeatureCollection` des zones du jour, au format de [format-zones.md](format-zones.md) (déjà lu par l'app web), ou `503` avant la première récupération |

- Map Patou n'est appelé qu'une fois par jour, heure de Paris (D1), et un seul appel à la fois. Sur un hébergement serverless qui s'éteint entre deux visites, ce sont les visites qui tiennent les zones à jour : la toute première attend les zones ; la première d'un nouveau jour reçoit celles de la veille pendant que celles du jour sont récupérées. Quand le serveur reste allumé, une tâche de fond vérifie aussi toutes les heures. En cas d'échec, les zones précédentes restent servies.
- `GET /api/health` répond `ok`, pour les vérifications de l'hébergeur.
- Seules les zones qui touchent le territoire de la V0 (Chartreuse et Vercors) sont gardées.
- Les journaux ne contiennent jamais les données, seulement ce qui s'est passé.
- `Zones:Refresh=false` coupe la tâche de fond (les tests n'appellent jamais Map Patou).
- **À vérifier avant de choisir l'hébergeur** : Map Patou ne répond pas aux machines de GitHub (D4) ; il faut s'assurer qu'il répond depuis l'hébergeur choisi.

## Signalements

Le format est celui de `content/observations.geojson`, déjà lu par l'app web : un troupeau s'écrit sans `kind`, une ruche ou un nid porte seulement son `kind` (`beehives`, `wasp-nest`, `bee-nest`, `hornet-nest`). Toute autre propriété est refusée : pas de texte libre, rien sur une personne.

| Méthode | Chemin | Accès | Réponse |
|---|---|---|---|
| `GET` | `/api/sightings` | public | `FeatureCollection` des signalements validés |
| `POST` | `/api/sightings` | public | `201` `{ id, status: "pending" }`, ou `400` `{ errors }` |
| `GET` | `/api/sightings/pending` | modérateur | `FeatureCollection` des signalements en attente |
| `POST` | `/api/sightings/{id}/approve` | modérateur | `204`, `404` si inconnu |

Exemple de dépôt :

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [5.65, 45.11] },
  "properties": { "observedAt": "2026-07-15T07:30:00.000Z", "species": "donkeys", "headcount": "few", "guardDogs": true }
}
```

## Modération

Les endpoints de modération demandent l'en-tête `X-Moderator-Key`, comparé à la clé `Moderation:Key` de la configuration (variable d'environnement `Moderation__Key`). Cette clé est un secret : jamais committée. Sans clé configurée, la modération reste fermée. C'est provisoire, en attendant les comptes et les rôles de la V1.

## Lancer en local

```bash
cd api
dotnet test
Moderation__Key=une-cle-locale dotnet run --project src/Sonnaille.Api
```

Sous Windows, si le dossier du dépôt est très profond (limite de 260 caractères), définir `SONNAILLE_BUILD_DIR` vers un dossier court (`C:\Temp\snb`) avant de compiler.

## Stockage

Avec une chaîne de connexion `ConnectionStrings:Sightings` (variable d'environnement `ConnectionStrings__Sightings`, un secret), les signalements et les zones sont gardés dans PostgreSQL avec PostGIS ; les tables `sightings` (position en `geography(Point, 4326)`), `pastoral_zones` (`geometry(MultiPolygon, 4326)`) et `zone_dataset` sont créées au démarrage si besoin. Sans elle, tout est gardé en mémoire et perdu au redémarrage.

Les mêmes tests de contrat passent sur les deux stockages : en mémoire partout, sur PostGIS quand `SONNAILLE_TEST_POSTGRES` est fournie (la CI lance une base PostGIS jetable).

## Branchement de l'app web

Si l'adresse de l'API est donnée à la construction du site (`--define "SONNAILLE_API_URL='https://…'"`, variable de dépôt `SONNAILLE_API_URL` en CI) :

- la carte lit les zones du jour à `GET /api/zones` (sauf en mode démo, qui garde ses zones fictives) ; le service worker garde la dernière réponse pour le hors ligne ;

- « Publier » envoie chaque signalement gardé sur l'appareil à `POST /api/sightings` ; ceux reçus sont retirés de l'appareil, les autres restent pour un nouvel essai ;
- la carte affiche les signalements publiés du fichier `content/observations.geojson` et ceux validés de `GET /api/sightings` ; si l'API ne répond pas, le fichier suffit.

Sans cette variable, les zones viennent du fichier fait par `npm run data` (développement) et la publication reste celle de la V0 (copier, coller dans GitHub).

## Reste à faire

- Hébergement : Scaleway et Neon, image et déploiement prêts ; comptes et secrets à créer ([deploiement-api.md](deploiement-api.md)).
- Comptes contributeurs et rôles à la place de la clé de modérateur.
