[English](README.md) · **Français**

# ui

L'interface : carte MapLibre, écrans, composants. Elle appelle les cas d'usage de `application`, affiche les objets de `domain` et implémente les ports d'affichage (par exemple `MapView`).

- Peut dépendre de `domain`, de `application` et de bibliothèques externes. Jamais d'`infrastructure` : les adaptateurs lui sont fournis par `src/main.ts`.
- Le code est en anglais ; les textes affichés aux utilisateurs restent en français.
