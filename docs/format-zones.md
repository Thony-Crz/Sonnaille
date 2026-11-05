# Format des zones pastorales (T10)

Le site publie un fichier `data/pastoral-zones.geojson`, construit par la CI et jamais versionné (voir [decisions.md](decisions.md), D1). C'est le seul format que l'application lit pour les zones : quelle que soit la source (Map Patou aujourd'hui, un export officiel ou le RPG demain), un adaptateur la convertit dans ce format.

Le code qui écrit, lit et valide ce format est dans `src/infrastructure/pastoral-zones-geojson.ts`. Un fichier invalide fait échouer la construction du site et n'est jamais affiché.

## Structure

Une `FeatureCollection` GeoJSON, plus un membre `metadata` :

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "source": "Map Patou — Réseau Pastoral AuRA",
    "requestedDate": "2026-07-15",
    "fetchedAt": "2026-07-15T05:00:00.000Z"
  },
  "features": [
    {
      "type": "Feature",
      "id": "UP…_Q01",
      "geometry": { "type": "MultiPolygon", "coordinates": [] },
      "properties": {
        "name": "Nom de l'alpage",
        "quarter": "Nom du quartier",
        "presence": {
          "start": "2026-06-15",
          "end": "2026-09-30",
          "species": ["sheep"],
          "guardDogs": true,
          "weekdays": [1, 2, 3, 4, 5, 6, 7]
        }
      }
    }
  ]
}
```

| Champ | Sens | Règle |
| --- | --- | --- |
| `metadata.source` | Producteur des données, affiché dans l'application | Obligatoire |
| `metadata.requestedDate` | Jour pour lequel les présences ont été demandées | `YYYY-MM-DD` |
| `metadata.fetchedAt` | Date et heure de récupération | ISO 8601 |
| `id` | Identifiant stable du quartier | Obligatoire, unique |
| `geometry` | Contour du quartier | `MultiPolygon` en WGS84, anneaux d'au moins 4 points |
| `properties.name` | Nom de l'unité pastorale | Obligatoire |
| `properties.quarter` | Nom du quartier | Texte, peut être vide |
| `properties.presence` | Troupeau prévu, ou `null` si aucun | Voir ci-dessous |
| `presence.start`, `presence.end` | Période de présence, bornes incluses | `YYYY-MM-DD`, fin ≥ début |
| `presence.species` | Espèces | `sheep`, `cattle`, `goats`, `horses`, `mixed` |
| `presence.guardDogs` | Chiens de protection présents | Booléen |
| `presence.weekdays` | Jours de présence | 1 (lundi) à 7 (dimanche) |

Aucune donnée personnelle : ni éleveur, ni berger, ni coordonnées.
