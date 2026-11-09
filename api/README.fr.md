[English](README.md) · **Français**

# api

API de la V1 (zones pastorales et signalements), ASP.NET Core (.NET 10), en clean architecture : `Sonnaille.Domain` ← `Sonnaille.Application` ← `Sonnaille.Infrastructure` ← `Sonnaille.Api`, vérifiée par un test d'architecture.

- `GET /api/zones` : zones pastorales du jour, récupérées par l'API chez Map Patou une fois par jour et gardées en base (décision D6).
- `GET /api/sightings` : signalements validés, même GeoJSON que `public/content/observations.geojson`.
- `POST /api/sightings` : déposer un signalement ; il attend la modération.
- `GET /api/sightings/pending`, `POST /api/sightings/{id}/approve` : réservés aux modérateurs (en-tête `X-Moderator-Key`, comparé au secret `Moderation:Key`).

```bash
dotnet test
```

Détails : [docs/api.md](../docs/api.md).
