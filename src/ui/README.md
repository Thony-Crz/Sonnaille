**English** · [Français](README.fr.md)

# ui

The interface: MapLibre map, screens, components. It calls the `application` use cases, displays `domain` objects, and implements the display ports (e.g. `MapView`).

- May depend on `domain`, `application` and external libraries. Never on `infrastructure`: adapters are provided by `src/main.ts`.
- Code is in English; text shown to users stays in French.
