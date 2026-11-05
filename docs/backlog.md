# Sonnaille — Backlog

Découpage du [cahier des charges](cahier-des-charges.md) en tâches. La V0 est détaillée ; la V1 et la V2 restent en grands chantiers, à découper le moment venu.

**Objectif de la V0** : une démo sur la Chartreuse et le Vercors, prête pour la saison d'estive 2027 (juin), qui permet de trouver 10 à 20 alpha users.

**Principe d'itération** : d'abord un squelette déployé de bout en bout (une carte en ligne), puis chaque lot ajoute une fonction visible. Les lots 0 et 1 peuvent avancer en parallèle : l'inventaire des données ne bloque pas le squelette.

## V0 — Démo Chartreuse et Vercors

### Lot 0 — Cadrage et données (à lancer tout de suite)

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T01 | Inventorier les sources de zones pastorales : RPG, enquêtes pastorales (Isère, Drôme), Pasto'rando | `docs/sources.md` liste chaque source : couverture, licence, format, date, précision, réutilisation autorisée | — |
| T02 | Étudier Map Patou : comment les données sont exposées, géométries, calendriers, fréquence de mise à jour | Note de faisabilité du scraping et échantillon de données récupéré à la main | — |
| T03 | Écrire au responsable de Map Patou | Mail envoyé (non bloquant) | — |
| T04 | Décider où vivent les données scrapées : dépôt privé (Pages payant) ou données hors du dépôt public | Décision notée dans `docs/decisions.md` | T02 |
| T05 | Vérifier les conditions d'usage des tuiles IGN (Géoplateforme) : Plan IGN, photographies aériennes | Conditions notées dans `docs/sources.md` | — |

### Lot 1 — Squelette déployé

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T06 | Initialiser le projet (proposition : Vite et TypeScript) et le déploiement GitHub Pages par GitHub Actions | Une page vide est en ligne après chaque push sur `main` | T04 |
| T07 | Afficher une carte MapLibre centrée sur la Chartreuse et le Vercors, fond IGN Plan | La carte s'affiche sur mobile et sur ordinateur | T06 |
| T08 | Ajouter le sélecteur de fonds (IGN Plan, photographies aériennes, OpenStreetMap), avec le choix mémorisé sur l'appareil | Le fond choisi est conservé au rechargement | T07 |
| T09 | Rendre l'app installable (manifeste, icônes), sans hors ligne | L'app s'installe sur Android et iPhone | T06 |

### Lot 2 — Données sur la carte

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T10 | Définir le format GeoJSON commun (zones, secteurs, observations, lieux, chemins) et le valider en CI | Schémas dans le dépôt, CI en échec si un fichier est invalide | T06 |
| T11 | Script d'import de la zone large depuis les données ouvertes, découpé sur les deux massifs | `zones.geojson` généré et valide | T01, T10 |
| T12 | Scraper Map Patou, isolé dans son propre module, lancé une fois par jour par GitHub Actions | `secteurs.geojson` mis à jour automatiquement, au plus une requête par jour | T02, T04, T10 |
| T13 | Afficher les couches activables, avec une légende | Chaque couche s'active et se désactive indépendamment | T07, T11 |
| T14 | Fiche d'une zone : nom, période de présence, source, date de mise à jour | Un toucher sur une zone ouvre sa fiche | T13 |

### Lot 3 — Import GPX et préparation de sortie

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T15 | Lire un GPX dans le navigateur (glisser-déposer ou sélection de fichier) et afficher le tracé | Le tracé s'affiche, aucune requête réseau ne contient le fichier | T07 |
| T16 | Saisir la date de la sortie | Les secteurs et observations sont filtrés selon cette date | T15 |
| T17 | Détecter ce que traverse le tracé (Turf.js) : zones, secteurs actifs à la date, observations de moins de 3 jours ; marge réglable | Tronçons concernés en surbrillance | T13, T16 |
| T18 | Écran de résultat : nom, point d'entrée, distance parcourue à l'intérieur, source et date, lien vers les conseils | Écran 3 conforme au cahier des charges | T17 |
| T19 | Tests de la détection avec des GPX de référence (traversée, frôlement, hors zone, hors période) | Tests verts en CI | T17 |

### Lot 4 — Pédagogie

| ID | Tâche | Terminé quand | Dépend de |
| --- | --- | --- | --- |
| T20 | Rédiger les 6 conseils au format JSON (message de 15 mots maximum, détail, source) | Fichier validé par schéma ; relecture par un acteur pastoral à organiser | T10 |
| T21 | Résumé pédagogique au résultat de l'import (écran 4) et fiche conseil (écran 5) | Le résultat d'un import mène aux bons conseils | T18, T20 |
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
| T29 | Trouver 10 à 20 alpha users (club de rando, groupe trail) | Critère de passage à la V1 atteint | T28 |

## V1 — Alpes (à découper plus tard)

- API ASP.NET Core, base PostgreSQL et PostGIS
- Comptes contributeurs (connexion Google, etc.) et rôles
- Signalements par les contributeurs et modération
- Question « les bêtes y sont toujours ? »
- Mode hors ligne
- Accès officiel aux données de Map Patou (remplacement du scraper)
- Extension aux Alpes
- Rappel le matin de la sortie, export du GPX annoté (Could)

## V2 — France (à découper plus tard)

- Rôle berger validé par un humain
- Fiches de lieux et témoignages (texte, photo, audio)
- Couverture nationale
