# Sources de données (T01)

Inventaire du 5 novembre 2026 pour la Chartreuse et le Vercors. Une case « à vérifier » signifie que l'information n'a pas été trouvée, pas qu'elle est défavorable.

## En bref

- **Aucune source ouverte et sous licence claire ne donne les contours d'alpages** sur les deux massifs.
- **La meilleure source est Map Patou** : contours de tous les quartiers pastoraux d'Auvergne-Rhône-Alpes, plus les calendriers de présence. Mais ses conditions de réutilisation ne sont pas publiées (voir [map-patou.md](map-patou.md)).
- **Le RPG est la seule source sous licence ouverte**, mais il décrit des parcelles déclarées pour la PAC, pas des alpages. Son usage pour les estives reste à vérifier.
- **Visorando affiche déjà Map Patou** et prévient quand un itinéraire traverse une zone (voir la section « Concurrence »).

## Zones pastorales

| Source | Producteur | Couverture | Licence | Accès | Millésime | Ce que représentent les polygones | Réutilisation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Map Patou | Réseau Pastoral AuRA, hébergé par l'INRAE (LESSEM) | Auvergne-Rhône-Alpes, dont Chartreuse (42 quartiers) et Vercors (146) | Non publiée | API GeoJSON publique, sans clé ([détails](map-patou.md)) | Calendriers 2026 | Quartiers d'unités et de zones pastorales | Inconnue ; Visorando la réutilise |
| Unité pastorale – Isère | DDT de l'Isère (bureau SIG) | Isère seulement : manque la partie savoyarde de la Chartreuse et la partie drômoise du Vercors | Non spécifiée sur data.gouv.fr | Archives ZIP, WMS, WFS ([fiche](https://www.data.gouv.fr/datasets/unite-pastorale-isere/)), moissonnées depuis open-datara | Ressources mises à jour en 2025 et 2026 | Unités pastorales | À demander à la DDT 38 |
| Enquête pastorale 2012-2014 | Irstea (devenu INRAE), Réseau pastoral régional | Alpes et Auvergne-Rhône-Alpes | Non trouvée | Site de consultation (enquete-pastorale.irstea.fr) ; pas de téléchargement trouvé | 2012-2014 | Unités pastorales d'estive et zones pastorales | À demander |
| RPG (Registre parcellaire graphique) | IGN, à partir des déclarations PAC (ASP) | France | Licence Ouverte 2.0 (Etalab) | Téléchargement sur data.gouv.fr et geoservices.ign.fr | Annuel | Parcelles et îlots déclarés pour la PAC ; depuis 2024, une couche « prairies permanentes » | Autorisée |

**À vérifier sur le RPG** : comment les estives collectives sont déclarées (codes de culture, par exemple SPH ou SPL ; prise en compte des groupements pastoraux), et si leurs contours se superposent bien aux alpages de Map Patou.

## Cabanes, points d'eau, logements

| Source | Producteur | Licence | Accès | Remarque |
| --- | --- | --- | --- | --- |
| Logements pastoraux | INRAE (LESSEM) | Non publiée | API publique paginée (`logements-pastoraux-api.lessem.inrae.fr/api/v1/logements/public`) | Chargée par la carte Map Patou ; contenu et données personnelles non étudiés |
| OpenStreetMap | Contributeurs OSM | ODbL (attribution et partage à l'identique pour une base dérivée) | Overpass, extraits Geofabrik | Abris, cabanes, points d'eau ; complétude à vérifier sur les deux massifs |
| BD TOPO | IGN | Licence Ouverte 2.0 | Téléchargement, WFS de la Géoplateforme | Bâti isolé et points d'eau ; la vocation pastorale n'est pas toujours indiquée |

## Fonds de carte (partiel, pour T05)

Map Patou charge le Plan IGN en tuiles vectorielles (`data.geopf.fr/tms/1.0.0/PLAN.IGN`) et une image satellite SPOT 2023 en WMTS, **sans clé**. Les conditions d'usage de la Géoplateforme, notamment pour la mise en cache hors ligne en V1, restent à lire.

## Concurrence

| Outil | Ce qu'il fait | Couverture | Source |
| --- | --- | --- | --- |
| Visorando | Calque « Troupeaux / Chiens de protection » issu de Map Patou ; **alerte quand l'itinéraire traverse une zone** (troupeau, troupeau avec chiens, aucun) ; site et application | 9 départements dont l'Isère, la Drôme et la Savoie, depuis juillet 2026 | [Visorando](https://www.visorando.com/actus/une-nouvelle-information-pour-mieux-prep.html) |
| Pastorando | Position des troupeaux par colliers GPS posés sur deux brebis par troupeau ; ancienneté de la position ; signalement d'incident | Allos et Haut-Verdon (Alpes-de-Haute-Provence) ; pas la Chartreuse ni le Vercors | [L'Info Durable](https://www.linfodurable.fr/dans-le-mercantour-pastorando-un-site-pour-geolocaliser-les-troupeaux-33133), [Verdon Tourisme](https://plan.verdontourisme.com/brochures/Communique_presse/CP-Pastorando-24-08-2023.pdf) |
| Map Patou | Carte de référence de la présence prévisionnelle | Auvergne-Rhône-Alpes | [Pasto Kézako](https://www.pasto-kezako.fr/) |

## Recommandation pour la V0

- **Zone large et secteurs prévus** : Map Patou, en usage privé, en attendant la réponse du Réseau Pastoral AuRA (T03). C'est la seule source qui couvre les deux massifs avec des dates.
- **Solution de repli sous licence ouverte** : le RPG pour la zone large, si la vérification des codes estives est concluante.
- **Cabanes et points d'eau** : OpenStreetMap, en respectant l'ODbL.
- **À ne pas faire** : publier les données de la DDT 38 ou de l'Enquête pastorale sans licence connue.

## Points à vérifier par un humain

- Conditions de réutilisation de Map Patou, et celles accordées à Visorando.
- Licence de la couche « Unité pastorale – Isère » auprès de la DDT 38.
- Traitement des estives dans le RPG.
- Équivalents de la couche DDT 38 en Savoie et dans la Drôme.
