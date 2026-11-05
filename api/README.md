**English** · [Français](README.fr.md)

# api

V1 sightings API, ASP.NET Core (.NET 10), clean architecture: `Sonnaille.Domain` ← `Sonnaille.Application` ← `Sonnaille.Infrastructure` ← `Sonnaille.Api`, checked by an architecture test.

- `GET /api/sightings`: approved sightings, same GeoJSON as `public/content/observations.geojson`.
- `POST /api/sightings`: submit a sighting; it waits for moderation.
- `GET /api/sightings/pending`, `POST /api/sightings/{id}/approve`: moderators only (`X-Moderator-Key` header, compared with the `Moderation:Key` secret).

```bash
dotnet test
```

Details (in French): [docs/api.md](../docs/api.md).
