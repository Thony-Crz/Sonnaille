# API des signalements (V1)

En V0, les signalements restent sur le téléphone puis sont publiés à la main dans `public/content/observations.geojson`. La V1 les reçoit sur un serveur, les fait valider par un modérateur, et ne publie que ceux qui sont validés.

## Architecture

ASP.NET Core (.NET 10) dans `api/`, en clean architecture, comme l'app web :

| Projet | Rôle | Dépend de |
|---|---|---|
| `Sonnaille.Domain` | Règles d'un signalement (troupeau ou nid, coordonnées, champs autorisés) | rien |
| `Sonnaille.Application` | Cas d'usage : déposer, valider, lister ; port `ISightingRepository` | Domain |
| `Sonnaille.Infrastructure` | Adaptateurs : stockage en mémoire (PostGIS plus tard) | Application |
| `Sonnaille.Api` | Endpoints HTTP, lecture et écriture du GeoJSON, racine de composition | Application, Infrastructure |

Un test d'architecture (`ArchitectureTests`) vérifie ces dépendances. Tout est écrit en TDD (`dotnet test` dans `api/`, lancé par la CI).

## Endpoints

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

## Branchement de l'app web

Si l'adresse de l'API est donnée à la construction du site (variable `VITE_SIGHTINGS_API_URL`, variable de dépôt `SIGHTINGS_API_URL` en CI) :

- « Publier » envoie chaque signalement gardé sur l'appareil à `POST /api/sightings` ; ceux reçus sont retirés de l'appareil, les autres restent pour un nouvel essai ;
- la carte affiche les signalements publiés du fichier `content/observations.geojson` et ceux validés de `GET /api/sightings` ; si l'API ne répond pas, le fichier suffit.

Sans cette variable, la publication reste celle de la V0 (copier, coller dans GitHub).

## Reste à faire

- Stockage PostgreSQL et PostGIS (les signalements en mémoire sont perdus au redémarrage).
- Hébergement de l'API.
- Comptes contributeurs et rôles à la place de la clé de modérateur.
