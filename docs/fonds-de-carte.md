# Fonds de carte

| Fond | Source | Licence et conditions | Précision |
| --- | --- | --- | --- |
| Plan IGN (par défaut) | Style vectoriel `PLAN.IGN` de la Géoplateforme | Données IGN ouvertes, sans clé | Bonne lecture générale, peu de détail pour la randonnée |
| Carte IGN 1:25 000 (SCAN 25) | Service privé WMTS de la Géoplateforme, couche `GEOGRAPHICALGRIDSYSTEMS.MAPS` | **Clé personnelle IGN obligatoire**, conditions d'usage à accepter auprès de l'IGN | La carte de randonnée de référence en France |
| Topographique (OpenTopoMap) | Tuiles `tile.opentopomap.org`, zoom 17 maximum | CC-BY-SA, attribution obligatoire ; usage raisonnable (pas de gros trafic) | Courbes de niveau, sentiers OpenStreetMap, relief ombré |
| Photos aériennes IGN | WMTS `ORTHOIMAGERY.ORTHOPHOTOS` | Données IGN ouvertes, sans clé | Repérer parcs, pistes, pelouses |
| OpenStreetMap | Tuiles `tile.openstreetmap.org` | Politique d'usage OSM : faible trafic toléré, à remplacer avant une ouverture large | Carte générale |

## Surcouche « Sentiers balisés »

Case à cocher dans le panneau « Fond de carte » : les itinéraires balisés (GR, PR, itinéraires locaux) de [Waymarked Trails](https://hiking.waymarkedtrails.org), d'après OpenStreetMap, par-dessus n'importe quel fond, sous les zones et le tracé. Licence CC-BY-SA, attribution affichée ; usage raisonnable.

## Activer la carte IGN 1:25 000

Le SCAN 25 n'est proposé que si une clé IGN est fournie au moment du build.

1. Créer un compte et une clé d'accès sur l'espace IGN (cartes.gouv.fr ou geoservices.ign.fr), et lire les conditions d'utilisation du SCAN 25 : usage autorisé, volumes, mention de l'IGN.
2. En local : créer un fichier `.env.local` (ignoré par git) contenant `VITE_IGN_SCAN25_KEY=la-cle`.
3. En production : dans GitHub, Settings → Secrets and variables → Actions → **Variables**, créer `IGN_SCAN25_KEY`. La CI la transmet au build.

Une clé utilisée dans une page web est visible de tous : c'est une clé de service public, pas un secret. Si l'IGN restreint la clé à un domaine, déclarer `thony-crz.github.io`.

Sans clé, le fond n'apparaît pas et l'application reste utilisable avec les autres fonds.
