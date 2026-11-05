# infrastructure

Les **adaptateurs** qui implémentent les ports de `application` : lecture des GeoJSON, données Map Patou, lecture de GPX, stockage local, calcul géographique (Turf.js).

- Peut dépendre de `domain`, de `application` et de bibliothèques externes. Jamais de `ui`.
- Le scraper Map Patou vit ici, isolé dans son propre module (voir `docs/decisions.md`, D1).
