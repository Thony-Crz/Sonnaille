**English** · [Français](README.fr.md)

# Sonnaille

Sonnaille helps trail runners, mountain bikers and hikers **prepare an outing** through pastoral land and **report what they saw afterwards**. It shows pastoral zones and planned flocks, checks a GPX track against them, and gives advice adapted to the zone and the activity about flocks and livestock guardian dogs (patous).

It is not a GPS app. It complements [Map Patou](https://www.pasto-kezako.fr/): Map Patou says where flocks are planned; Sonnaille adds outing preparation, advice and field observations.

## Status

V0 in progress: a demo on the Chartreuse and Vercors massifs (French Alps). See the [backlog](docs/backlog.md).

## Documentation

Project documents are written in French:

- [Cahier des charges](docs/cahier-des-charges.md) (specification)
- [Backlog](docs/backlog.md)
- [Décisions](docs/decisions.md) (technical decisions)
- [Sources de données](docs/sources.md) and [étude Map Patou](docs/map-patou.md)

## Development

Requires Node.js 22.

```bash
npm install
npm run dev      # http://localhost:5173/Sonnaille/
npm test         # unit and architecture tests
npm run build    # type check and production build
npm run data     # fetch today's pastoral zones from Map Patou (never committed)
```

- **Zones for another day**: `MAP_PATOU_DATE=2026-07-15 npm run data`, then open `/Sonnaille/?date=2026-07-15`. At most one request per day is sent to Map Patou.
- **Field sightings**: "Signaler animaux, ruches ou nids", tap the map, say what was seen (flock, beehives, wasp, bee or hornet nest), save: the sighting is kept on the device ("Mes signalements"). "Publier" copies the entries and opens the GitHub editor of `public/content/observations.geojson`: paste them into `features` and commit.
- **Base maps**: see [fonds-de-carte.md](docs/fonds-de-carte.md), including how to enable the IGN 1:25,000 map with a personal IGN key.
- **Demo**: [docs/demo](docs/demo/README.md).

## Conventions

- **TDD**: every piece of production code starts with a failing test.
- **Clean architecture**: `src/domain`, `src/application`, `src/infrastructure`, `src/ui`, wired together in `src/main.ts`. A test in `tests/architecture/` enforces the dependency rule.
- **Language**: code in English; documentation and user-facing text in French; READMEs in both.

Details in [decisions.md](docs/decisions.md) (D2, D3).
