**English** · [Français](README.fr.md)

# infrastructure

The **adapters** implementing the `application` ports for data: GeoJSON reading, Map Patou data, GPX reading, local storage, geographic computation (Turf.js).

- May depend on `domain`, `application` and external libraries. Never on `ui`.
- The Map Patou scraper lives here, isolated in its own module (see `docs/decisions.md`, D1).
