**English** · [Français](README.fr.md)

# ui

What the interface needs, without any framework: the MapLibre map adapter (`maplibre-map-view.ts`, which implements the `MapView` port), the base maps, the sighting pictures, the colors and the texts shown to users. The Angular front (`src/app`) uses it.

- May depend on `domain`, `application` and external libraries. Never on `infrastructure`: adapters are provided by the composition root, `src/app/app.config.ts`.
- Code is in English; text shown to users stays in French.
