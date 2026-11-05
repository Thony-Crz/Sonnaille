[English](README.md) · **Français**

# api

API des signalements de la V1, ASP.NET Core (.NET 10), en clean architecture : `Sonnaille.Domain` ← `Sonnaille.Application` ← `Sonnaille.Infrastructure` ← `Sonnaille.Api`, vérifiée par un test d'architecture.

- `GET /api/sightings` : signalements validés, même GeoJSON que `public/content/observations.geojson`.
- `POST /api/sightings` : déposer un signalement ; il attend la modération.
- `GET /api/sightings/pending`, `POST /api/sightings/{id}/approve` : réservés aux modérateurs (en-tête `X-Moderator-Key`, comparé au secret `Moderation:Key`).

```bash
dotnet test
```

Détails : [docs/api.md](../docs/api.md).
