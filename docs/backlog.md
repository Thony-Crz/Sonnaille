# Sonnaille — Backlog

Découpage du [cahier des charges](cahier-des-charges.md) en tâches. La V0 est détaillée ; la V1 et la V2 restent en grands chantiers, à découper le moment venu.

**Objectif de la V0** : une démo sur la Chartreuse et le Vercors, prête pour la saison d'estive 2027 (juin), qui permet de trouver 10 à 20 alpha users.

**Définition de « terminé » pour toute tâche de code** : écrite en TDD (le test a d'abord échoué), rangée dans la bonne couche de la clean architecture, tests et test d'architecture verts en CI ([decisions.md](decisions.md), D2).

**Principe d'itération** : d'abord un squelette déployé de bout en bout (une carte en ligne), puis chaque lot ajoute une fonction visible. Les lots 0 et 1 peuvent avancer en parallèle : l'inventaire des données ne bloque pas le squelette.

## V0 — Démo Chartreuse et Vercors

### Lot 0 — Cadrage et données (à lancer tout de suite)

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| ~~T01~~ ✅ | Inventorier les sources de zones pastorales : RPG, enquêtes pastorales (Isère, Drôme), Pasto'rando | Fait : [sources.md](sources.md) | — |
| ~~T02~~ ✅ | Étudier Map Patou : comment les données sont exposées, géométries, calendriers, fréquence de mise à jour | Fait : [map-patou.md](map-patou.md) | — |
| ~~T30~~ ✅ | Revoir le positionnement face à Visorando | Fait : cible trail et VTT, conseils adaptés, observations de terrain (cahier des charges, section 1) | T01 |
| T03 | Écrire au responsable de Map Patou, en demandant les mêmes conditions de réutilisation que Visorando | Mail envoyé (non bloquant) | — |
| ~~T04~~ ✅ | Décider où vivent les données scrapées | Fait : hors du dépôt public, récupérées à la construction ([decisions.md](decisions.md), D1) | T02 |
| T05 | Vérifier les conditions d'usage des tuiles IGN (Géoplateforme) : Plan IGN, photographies aériennes | Conditions notées dans `docs/sources.md` | — |

### Lot 1 — Squelette déployé

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T06 | Initialiser le projet (Vite, TypeScript, Vitest), les couches de la clean architecture avec leur test, le déploiement GitHub Pages par artefact (`deploy-pages`, pas de branche `gh-pages`) ; `robots.txt` et `noindex` | Une page vide, non indexable, est en ligne après chaque push sur `main` ; tests verts en CI | T04 |
| ~~T07~~ ✅ | Afficher une carte MapLibre centrée sur la Chartreuse et le Vercors, fond IGN Plan | Fait : vérifiée sur mobile et sur ordinateur, en développement et en build de production | T06 |
| ~~T08~~ ✅ | Ajouter le sélecteur de fonds (IGN Plan, photographies aériennes, OpenStreetMap), avec le choix mémorisé sur l'appareil | Fait : panneau « Fond de carte », choix conservé au rechargement, attribution propre à chaque fond | T07 |
| ~~T09~~ ✅ | Rendre l'app installable (manifeste, icônes), sans hors ligne | Fait : manifeste, logo « A — Sonnaille » décliné en icônes (`npm run icons`), balises iPhone ; installation réelle sur téléphone à confirmer | T06 |

### Lot 2 — Données sur la carte

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| ~~T10~~ ✅ | Définir le format GeoJSON commun et le valider en CI | Fait pour les zones pastorales ([format-zones.md](format-zones.md)) ; observations, lieux et chemins seront ajoutés avec leurs tâches | T06 |
| ~~T11~~ ✅ | Zone large : contours de tous les quartiers Map Patou découpés sur le territoire ; repli sur le RPG si la réutilisation est refusée | Fait : `npm run data` produit `public/data/pastoral-zones.geojson` | T01, T10 |
| ~~T12~~ ✅ | Scraper Map Patou (`POST /api/v1/map/geojson`), isolé dans son propre module, appelé à la construction du site (une fois par jour en saison) ; normaliser `type_animal` ; données jamais committées ni affichées dans les logs | Fait en local ; en CI l'API n'est pas joignable (D4), le site se déploie sans zones | T02, T04, T10 |
| ~~T13~~ ✅ | Afficher les couches activables, avec une légende | Fait : trois statuts (troupeau avec chiens, troupeau prévu, pas de troupeau), légende avec source et date, couches conservées au changement de fond, `?date=` pour afficher un autre jour | T07, T11 |
| ~~T14~~ ✅ | Fiche d'une zone : nom, période de présence, espèce, chiens, source, date de mise à jour, conseils adaptés | Fait : fiche au toucher (panneau du bas sur téléphone, latéral sur ordinateur), conseils selon l'activité mémorisée, source et avertissement | T13, T20 |

### Lot 3 — Import GPX et préparation de sortie

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| ~~T15~~ ✅ | Lire un GPX dans le navigateur (glisser-déposer ou sélection de fichier) et afficher le tracé ; tester avec des exports Strava, Komoot et Garmin | Fait : bouton « Importer un GPX » et dépôt sur la carte, lecture locale (traces et itinéraires, formats Strava, Komoot, Garmin testés sur des GPX fictifs), tracé au-dessus des zones | T07 |
| ~~T16~~ ✅ | Saisir la date de la sortie et l'activité (trail, VTT, randonnée) | Fait : date de la sortie (aujourd'hui par défaut) et activité mémorisée dans le panneau « Votre sortie » ; la carte suit la date | T15 |
| ~~T17~~ ✅ | Détecter ce que traverse le tracé (Turf.js) : zones, secteurs actifs à la date, observations de moins de 3 jours ; marge réglable | Fait : détection en TypeScript pur dans le domaine (D2), marge de 50 m par défaut, zones traversées en surbrillance ; observations à ajouter avec le lot 5 | T13, T16 |
| ~~T18~~ ✅ | Écran de résultat : nom, point d'entrée, distance parcourue à l'intérieur, source et date, lien vers les conseils | Fait : panneau « Votre sortie » (résumé, zones dans l'ordre, km d'entrée, distance dans la zone, période) | T17 |
| T19 | Tests d'intégration de la détection avec des GPX de référence (traversée, frôlement, hors zone, hors période) ; les tests unitaires, eux, sont écrits avant le code dans chaque tâche | Tests verts en CI | T17 |

### Lot 4 — Pédagogie

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| ~~T20~~ ✅ | Rédiger les conseils au format JSON, déclinés par espèce, présence de chiens et activité (message de 15 mots maximum, détail, source publique citée) | Fait : `public/content/advice.json`, 9 conseils tirés de Pasto Kézako, vérifiés par un test (15 mots max, source, couverture statut × activité) ; relecture par un professionnel à venir (V1) | T10 |
| ~~T21~~ ✅ | Résumé pédagogique au résultat de l'import (écran 4) et fiche conseil (écran 5), avec les conseils choisis selon le contexte | Fait : conseils du statut le plus prudent rencontré et de l'activité, dans « Votre sortie » et la fiche de zone | T18, T20 |
| T22 | Page « Comprendre » | Accessible depuis le menu à tout moment | T20 |
| T23 | Avertissement « l'application ne garantit rien » et mentions des sources | Visible au premier lancement et sur chaque résultat | T18 |

### Lot 5 — Observations de terrain

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T24 | Écran de signalement : choix d'un point ou d'un kilomètre du GPX, heure déduite, champs structurés (espèce, effectif, patou vu) | L'écran produit une entrée GeoJSON à ajouter au dépôt (pas de serveur en V0) | T15, T10 |
| T25 | Afficher les observations : halo par espèce (paramètres en JSON), nettes pendant 3 jours puis pâlies, historique conservé | Une observation de plus de 3 jours apparaît pâlie | T13, T24 |

### Lot 6 — Finition et démo

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T26 | Afficher sa position sur la carte (Could) | Point de position, sans suivi ni alerte | T07 |
| T27 | Passe mobile : affichage, performance, lisibilité en plein soleil | Parcours complet fluide sur un téléphone moyen de gamme | Lots 1 à 5 |
| T28 | Préparer la démo : jeu de GPX de démonstration, scénario, support pour les partenaires | Démo jouable en 10 minutes | T27 |
| T29 | Trouver 10 à 20 alpha users, en priorité dans un club de trail ou de VTT | Critère de passage à la V1 atteint | T28 |

## V1 — Alpes (à découper plus tard)

- API ASP.NET Core, base PostgreSQL et PostGIS
- Comptes contributeurs (connexion Google, etc.) et rôles
- Signalements par les contributeurs et modération
- Question « les bêtes y sont toujours ? »
- Mode hors ligne
- Accès officiel aux données de Map Patou (remplacement du scraper)
- Extension aux Alpes
- Relecture des conseils par un acteur du pastoralisme (la promesse d'expertise)
- Rappel le matin de la sortie (Could)
- Notifications pendant la sortie sur le téléphone, avec le mode hors ligne (Could, peut-être après la V1)
- Contact avec Visorando (V1 ou V2)

## V2 — France (à découper plus tard)

- Rôle berger validé par un humain
- Fiches de lieux et témoignages (texte, photo, audio)
- Couverture nationale

## V3 — Envisagée

- Enregistrer des randonnées et des GPX, dimension collaborative, avec un choix explicite de l'utilisateur pour chaque tracé
