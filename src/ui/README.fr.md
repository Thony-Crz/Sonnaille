[English](README.md) · **Français**

# ui

Ce dont l'interface a besoin, sans framework : l'adaptateur de carte MapLibre (`maplibre-map-view.ts`, qui implémente le port `MapView`), les fonds de carte, les pictogrammes des signalements, les couleurs et les textes montrés aux utilisateurs. Le front Angular (`src/app`) s'en sert.

- Peut dépendre de `domain`, de `application` et de bibliothèques externes. Jamais d'`infrastructure` : les adaptateurs sont fournis par la racine de composition, `src/app/app.config.ts`.
- Le code est en anglais ; les textes montrés aux utilisateurs restent en français.
