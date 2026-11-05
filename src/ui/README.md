# ui

L'interface : carte MapLibre, écrans, composants. Elle appelle les cas d'usage de `application` et affiche les objets de `domain`.

- Peut dépendre de `domain`, de `application` et de bibliothèques externes. Jamais d'`infrastructure` : les adaptateurs lui sont fournis par `src/main.ts`.
