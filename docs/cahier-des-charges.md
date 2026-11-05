# Sonnaille — Cahier des charges

Version 2.1 · Nov 5, 2026 · @Anthony

Sonnaille aide d'abord les **traileurs et les vététistes**, puis les randonneurs, à **préparer leur sortie** en territoire pastoral et à **signaler ce qu'ils ont vu après**, avec des conseils adaptés à la zone et à l'activité sur les troupeaux et les chiens de protection (patous). Ce n'est pas un GPS. Elle complète Map Patou : Map Patou dit où les troupeaux sont prévus, l'application ajoute la préparation de sortie, la pédagogie et les observations de terrain.

## 1. Contexte, positionnement et objectifs

Le pastoralisme est mal connu des pratiquants d'activités de plein air, et les rencontres avec les patous sont une source de tension. Des outils existent mais restent partiels :

| Outil | Ce qu'il fait | Ce qui manque |
| --- | --- | --- |
| Map Patou (Réseau Pastoral Auvergne-Rhône-Alpes, hébergé par l'INRAE) | Présence *prévisionnelle* des troupeaux protégés en estive, calendriers tenus par des comptes à rôles (éleveur, contributeur, admin) | Préparation d'une sortie à partir d'un tracé, pédagogie, observations de terrain |
| Pastorando | Position des troupeaux par colliers GPS | Limité à Allos et au Haut-Verdon, pas de pédagogie |
| Visorando | Calque Map Patou et alerte quand un itinéraire traverse une zone, depuis juillet 2026, dans 9 départements dont l'Isère, la Drôme et la Savoie | Pédagogie réduite à un rappel général, pas d'observations de terrain, rien de spécifique au trail ou au VTT |
| Strava, Komoot, Garmin Connect | Préparation de sorties trail et VTT, échange de GPX | Pas de données pastorales (à vérifier) |

**Positionnement**

- **Cible principale : les traileurs et les vététistes.** Ils préparent leurs sorties hors de Visorando, manipulent des GPX tous les jours, et ce sont les profils les plus exposés face aux patous, car une allure rapide est lue comme une menace. Les randonneurs sont une cible secondaire : ils ont la carte des zones sans avoir à importer de GPX.
- **Ce qui distingue Sonnaille de Visorando** : des conseils adaptés au GPX ou à la zone consultée (espèce, chiens, activité), des observations de terrain modérées, et à terme une expertise validée par des acteurs du pastoralisme. Cette expertise est une promesse : elle n'est pas en V0.
- **Un complément de Map Patou**, pas une source concurrente. À terme, l'application affiche ses calendriers avec l'accord du Réseau Pastoral AuRA et en citant la source.
- **Visorando** : à contacter en V1 ou en V2, en vue d'un partenariat.

**Objectifs**

- **Préparer** : importer un tracé GPX la veille et voir les zones pastorales et les troupeaux prévus ou observés sur le parcours, à la date de la sortie.
- **Éduquer** : donner les bons réflexes au moment où l'on prépare la sortie, en messages courts.
- **Signaler** : après la sortie, indiquer sur son tracé où l'on a croisé un troupeau ; l'observation reste visible 3 jours.
- **Rendre visible** le territoire pastoral : estives, cabanes, parcs, points d'eau, chemins de transhumance.

**Principes non négociables**

- **Avant et après la sortie.** Le GPS ne sert qu'à afficher sa position sur la carte ; c'est une fonction secondaire. Un usage pendant la sortie (notifications sur le téléphone) n'est envisageable qu'avec le mode hors ligne, après la V0.
- **On signale des zones, jamais des chiens ni des personnes.** Aucune identité ni coordonnée de berger n'est affichée, aucun patou n'est relié à un berger, aucun texte libre ne décrit le comportement d'un chien.
- **Le tracé GPX ne quitte jamais l'appareil.** Seul le point d'observation choisi par l'utilisateur est envoyé.
- **L'application ne garantit rien.** Elle indique des zones et des probabilités de présence, jamais l'absence de troupeau ou de chien. Un avertissement le rappelle.

**Hors périmètre** : navigation avec guidage, export vers une montre, gestion des troupeaux par les éleveurs, données de santé animale, localisation de chiens individuels.

## 2. Phasage

Trois versions, chacune ouverte seulement si la précédente a atteint son critère de passage.

| | V0 — Démo | V1 — Alpes | V2 — France |
| --- | --- | --- | --- |
| Territoire | Chartreuse et Vercors | Alpes | France |
| But | Démonstration pour des partenaires et premiers alpha users, prête pour la saison d'estive 2027 | Usage réel par des alpha users | Ouverture large |
| Données | Données ouvertes (zone large), Map Patou récupéré par scraping (usage privé), observations d'Anthony | Map Patou par accord ou export officiel, signalements des contributeurs | Couverture nationale, contenus validés par les bergers |
| Comptes | Aucun (un seul éditeur) | Comptes contributeurs (Google, etc.) | Rôle berger validé par un humain |
| Technique | Site statique, GitHub Pages et Actions | API et base géographique | — |
| Hors ligne | Non | Oui, si le GPS est utilisé sur le terrain | Oui |
| Critère de passage | 10 à 20 alpha users trouvés, de préférence dans un club de trail ou de VTT | À définir (proposition : chaque alpha user fait au moins une préparation et un signalement par saison, sans relance) | — |

**V3, envisagée** : enregistrer des randonnées et des GPX, et ouvrir une dimension collaborative comme Visorando. Cela contredit le principe « le tracé ne quitte jamais l'appareil » : il faudra un choix explicite de l'utilisateur, tracé par tracé.

## 3. Utilisateurs

| Profil | Besoin principal | À partir de |
| --- | --- | --- |
| Traileur, vététiste (cible principale) | Préparer sa sortie à partir d'un GPX (Strava, Komoot, Garmin), savoir comment réagir à allure rapide, signaler après | V0 en consultation, V1 en contribution |
| Randonneur (cible secondaire) | Consulter la carte des zones et les conseils, importer un GPX s'il le souhaite | V0 |
| Curieux, habitant | Comprendre le pastoralisme local | V0 |
| Contributeur | Signaler des troupeaux observés | V1 (compte requis) |
| Berger, éleveur | Faire connaître son activité, valider des secteurs, témoigner | V2 (rôle validé) |
| Éditeur, modérateur | Saisir et valider les données | V0 (Anthony seul) |

## 4. Fonctionnalités

| # | Fonctionnalité | Version | Précision |
| --- | --- | --- | --- |
| F1 | Carte des zones pastorales, secteurs prévus, observations, cabanes, points d'eau, chemins | V0 | Couches activables |
| F2 | Fonds de carte sélectionnables, IGN par défaut | V0 | Voir section 9 |
| F3 | Import GPX et détection des zones et troupeaux sur le tracé, à la date de sortie | V0 | Voir section 6 |
| F4 | Conseils pédagogiques adaptés au contexte | V0 | Au résultat de l'import GPX, sur la fiche de chaque zone cliquée, page « Comprendre » ; adaptés à l'espèce, aux chiens et à l'activité ; voir section 8 |
| F5 | Signalement après la sortie (point ou kilomètre du GPX) | V0 pour l'éditeur, V1 pour les contributeurs | Voir section 7 |
| F6 | Afficher sa position sur la carte | V0 (Could) | Point de position seulement, pas de suivi ni d'alerte |
| F7 | Question « les bêtes y sont toujours ? » | V1 | Posée à qui importe un GPX passant près d'une observation récente |
| F8 | Comptes contributeurs | V1 | Requis uniquement pour contribuer ; la consultation reste anonyme |
| F9 | Mode hors ligne (fonds et zones d'un secteur) | V1 | Indispensable si la carte est consultée sur le terrain |
| F10 | Rappel le matin de la sortie | V1 (Could) | Si l'utilisateur donne la date ; notifications web limitées sur iPhone |
| F11 | Notifications pendant la sortie, sur le téléphone | Après la V1 (Could) | Seulement avec le mode hors ligne ; une alerte selon la position, application fermée, demandera probablement une application native |
| F12 | Fiches de lieux avec témoignages de bergers | V2 | Texte et photo d'abord, audio ensuite ; accord écrit |
| F13 | Rôle berger validé par un humain | V2 | Validation à confier de préférence à une structure pastorale partenaire |

## 5. Données

Trois niveaux d'information, du plus large au plus précis :

| Niveau | Ce qu'il dit | Source | Durée de validité |
| --- | --- | --- | --- |
| Zone pastorale | « Territoire pastoral, des troupeaux peuvent s'y trouver en saison » | Données ouvertes (voir tableau des sources) | La saison |
| Secteur prévu | « Un troupeau protégé est prévu ici entre telle et telle date » | Map Patou | Le calendrier de présence |
| Observation | « Un troupeau a été vu ici à telle heure » | Signalements après la sortie | 3 jours, puis la marque pâlit ; l'historique reste rattaché à la zone |

**Sources à inventorier avant de coder**

Pour chaque source : couverture, licence, format, date de mise à jour, précision, réutilisation autorisée ou non.

| Source | Usage prévu | Statut |
| --- | --- | --- |
| Registre parcellaire graphique (RPG, data.gouv.fr) | Zone pastorale (catégories estives et landes) | À vérifier pour la Chartreuse et le Vercors |
| Enquêtes pastorales (unités pastorales) | Zone pastorale, contours plus fins | Disponibilité en Isère et dans la Drôme à vérifier |
| Map Patou | Secteurs prévus et calendriers | V0 : scraping, usage privé. Licence non précisée (la politique de confidentialité d'avril 2024 ne traite que des données personnelles). V1 : accord ou export officiel |
| Pasto'rando | À évaluer | Relation à définir |
| Observations de terrain | Observations | V0 : Anthony ; V1 : contributeurs |

**Règles pour Map Patou en V0**

- Le scraper est isolé dans un module, remplaçable par un accès officiel sans toucher au reste.
- Un passage par jour au maximum, en période d'estive.
- Les données récupérées ne sont pas publiées publiquement (dépôt privé, voir section 10).
- La source est citée dans l'application.
- Le responsable de Map Patou est contacté en parallèle du développement, et l'origine des données est annoncée d'emblée lors de la démo.

## 6. Import GPX et préparation de sortie

L'utilisateur dépose un fichier GPX, indique la date de sa sortie, et obtient en quelques secondes ce que son tracé traverse.

**Règles de détection**

- Le fichier est lu dans le navigateur ; pistes et routes sont prises en compte ; le fichier n'est jamais envoyé au serveur.
- Le tracé est comparé aux zones pastorales, aux secteurs prévus actifs à la date de la sortie et aux observations de moins de 3 jours.
- Une marge autour des zones est réglable (valeur à définir avec des bergers et des utilisateurs).
- Pour chaque élément traversé, le résultat indique : le nom, le point d'entrée, la distance parcourue à l'intérieur, la source et sa date de mise à jour, et un lien vers les conseils.

**Ton du résultat** : pas d'alerte de danger. Le message dit « tu passes en territoire pastoral de juillet à septembre, voici les réflexes », et devient plus précis quand un secteur prévu ou une observation récente est sur le tracé. C'est le moment pédagogique principal.

## 7. Signalement après la sortie

1. L'utilisateur importe le GPX de sa sortie.
2. Il choisit un point sur le tracé, ou un kilomètre.
3. L'heure de l'observation est déduite du GPX, qui horodate chaque point.
4. Il renseigne des champs structurés : espèce, effectif approximatif, patou vu ou non. Pas de texte libre sur le comportement des chiens.
5. Seul ce point est envoyé ; le tracé reste sur l'appareil.

**Affichage** : l'observation est un point entouré d'un halo dont la taille dépend de l'espèce (par exemple 500 m pour des bovins). Les valeurs de halo sont des paramètres stockés hors du code, à fixer avec un berger. L'observation reste nette 3 jours, puis pâlit.

**En V0**, l'éditeur ajoute ses observations à un fichier GeoJSON publié par commit.

## 8. Module pédagogique : troupeaux et patous

Les conseils apparaissent sous forme de messages courts, avec un détail accessible en un toucher.

**Déclencheurs** : le résultat d'un import GPX (moment principal, la veille de la sortie), la fiche de chaque zone pastorale cliquée sur la carte, la page « Comprendre » consultable à tout moment, et en V1 le rappel du matin.

**Conseils adaptés** : le message dépend du contexte connu : espèce (ovins, bovins…), présence de chiens, et activité choisie par l'utilisateur (trail, VTT, randonnée). Un vététiste qui traverse une zone ovine avec chiens ne lit pas le même message qu'un randonneur dans une zone bovine.

**Expertise** : en V0, les conseils sont rédigés à partir de sources publiques citées et affichés comme « non encore relus par un professionnel ». La relecture par des acteurs du pastoralisme est une promesse de la V1.

| Situation | Message court (écran) | Pour aller plus loin |
| --- | --- | --- |
| Approche d'un troupeau | Ralentir, rester calme, contourner largement | Pourquoi le troupeau est là, comment le berger travaille |
| Un patou s'approche ou aboie | S'arrêter, ne pas courir, parler calmement | Le chien protège le troupeau, ce n'est pas de l'agressivité envers vous |
| À vélo ou en trail | Mettre pied à terre ou marcher, ne pas traverser le troupeau | Une allure rapide est lue comme une menace |
| Avec son propre chien | Le tenir près de soi, le plus souvent en laisse | Risque de conflit entre chiens |
| Passage de parc ou de clôture | Refermer, ne pas franchir un parc de nuit | Repérage des parcs sur la carte |
| Contact physique avec un patou | Distinguer un pincement d'une morsure | Comportement à adopter, qui prévenir en cas de vraie morsure |

Format : un message de 15 mots maximum, une illustration simple, un texte de détail et la source. Les contenus sont stockés séparément du code pour être corrigés sans mise à jour de l'application. Aucun conseil ne relie un chien à un berger identifiable.

## 9. Fonds de carte

L'utilisateur choisit son fond dans un sélecteur ; la carte IGN est le fond par défaut, et le choix est mémorisé sur l'appareil.

| Fond | Rôle | Statut |
| --- | --- | --- |
| IGN Plan (défaut) | Relief, sentiers, toponymes | V0 |
| IGN Photographies aériennes | Repérer pistes, parcs, étendue des pelouses | V0 (Should) |
| OpenStreetMap | Alternative libre, secours | V0 (Should) |
| Fond topographique / relief | Lecture du terrain en montagne | Could |

Les couches pastorales se superposent au fond choisi et s'activent indépendamment. Les conditions d'usage des tuiles IGN (Géoplateforme), notamment pour la mise en cache hors ligne en V1, sont à vérifier.

## 10. Architecture et choix techniques

**V0 : un site statique, sans serveur applicatif**

| Sujet | Choix |
| --- | --- |
| Application | Web app installable, mobile en premier |
| Carte | MapLibre GL JS |
| Lecture GPX et calcul de traversée | Bibliothèque GPX et Turf.js, dans le navigateur |
| Données | Fichiers GeoJSON (zones, secteurs, observations) et JSON (conseils, halos par espèce) |
| Hébergement | GitHub Pages |
| Automatisation | GitHub Actions : scraping quotidien de Map Patou, construction et déploiement |
| Observations | Fichier GeoJSON mis à jour par commit après chaque sortie |

**Point d'attention** : un dépôt public publié sur GitHub Pages rend publiques les données scrapées. Il faut soit un dépôt privé (Pages depuis un dépôt privé demande un abonnement GitHub payant), soit garder ces données hors du dépôt public.

**V1 : quand arrivent les comptes et les contributions extérieures**

| Sujet | Choix |
| --- | --- |
| API | ASP.NET Core |
| Base | PostgreSQL et PostGIS |
| Authentification | Connexion externe (Google, etc.), rôles |
| Hors ligne | Service worker, cache des tuiles et des zones d'un secteur |
| Médias (V2) | Stockage objet pour photos et audio |

## 11. Modèle de données

| Entité | Géométrie | Champs principaux | Version |
| --- | --- | --- | --- |
| Zone pastorale | Polygone | Nom, source, date de mise à jour, période de présence | V0 |
| Secteur prévu | Selon la source | Calendrier de présence, source (Map Patou), date de récupération | V0 |
| Observation | Point | Date et heure, espèce, effectif approximatif, patou vu, date d'expiration (+3 jours), zone de rattachement | V0 |
| Lieu | Point | Type (cabane, point d'eau, parc), niveau de précision affiché, accord du berger | V0 |
| Chemin de transhumance | Ligne | Nom, période | V0 |
| Conseil | — | Situation, message court, illustration, détail, source | V0 |
| Paramètre d'espèce | — | Espèce, rayon du halo | V0 |
| Utilisateur | — | Rôle (contributeur, berger, modérateur) | V1 |
| Témoignage | — | Lieu, auteur, média, accord écrit, date de retrait éventuel | V2 |

Le tracé GPX importé n'est pas une entité : il n'est jamais enregistré côté serveur.

## 12. Écrans

| # | Écran | Changement par rapport à la version 1 |
| --- | --- | --- |
| 1 | Carte, couches, sélecteur de fond, import GPX | Ajout des couches « secteurs prévus » et « observations » |
| 2 | Liste des fonds | Inchangé |
| 3 | Résultat de l'import : tronçons traversés en surbrillance | Ajout de la date de sortie, des sources et de leur date de mise à jour |
| 4 | Résumé pédagogique du résultat | Remplace l'écran « alerte » : plus d'alerte en cours de sortie |
| 5 | Fiche conseil courte | Ajout du conseil pincement ou morsure |
| 6 | Fiche d'un lieu | Les témoignages passent en V2 |
| 7 | Signalement après la sortie | Nouvel écran : choix du point ou du kilomètre, champs structurés |

## 13. Risques

| Risque | Conséquence | Parade |
| --- | --- | --- |
| Réutilisation des données de Map Patou sans accord | Perte de confiance du partenaire principal, problème juridique si publication | Usage privé en V0, dépôt privé, contact du responsable en parallèle, origine annoncée à la démo, scraper isolé |
| Visorando propose déjà l'alerte de traversée de zone | Pas de raison d'adopter Sonnaille | Cible trail et VTT, conseils adaptés au contexte, observations de terrain ; partenariat envisagé en V1 ou V2 |
| Expertise promise mais pas encore apportée | Perte de crédibilité auprès des utilisateurs et des partenaires | Conseils sourcés et affichés comme non relus en V0 ; recherche d'un relecteur pour la V1 |
| Dépendance à une seule source pour les secteurs prévus | Démo vide si l'accès est coupé | Zone large en données ouvertes et observations propres, Map Patou activable ou non |
| Contours imprécis ou datés | Fausses alertes ou oublis | Source et date de mise à jour affichées, validation par les bergers |
| Alerte systématique en saison | Messages ignorés | Ton pédagogique, précision croissante selon le niveau de donnée |
| Signalements utilisés pour viser un berger | Bashing, perte de confiance des éleveurs | Champs structurés, pas de texte libre, aucune identité affichée |
| Conseils jugés inexacts | Perte de confiance | Relecture par des acteurs du pastoralisme, sources citées |
| Localisation de cabanes ou de parcs sensibles | Fréquentation indésirable | Accord du berger, niveau de précision réglable |
| Incident avec un patou malgré l'application | Mise en cause de l'application | Avertissement : l'application ne garantit pas l'absence de troupeau ou de chien |
| Conditions d'usage des tuiles IGN | Fond indisponible ou usage non conforme | Vérification avant mise en ligne, fond OSM en secours |
| Témoignages : droits et consentement | Problème juridique | Accord écrit, droit de retrait |
| Périmètre trop large pour un projet personnel | Abandon | Phasage V0, V1, V2 avec critère de passage |

## 14. Questions

**Tranchées**

- [x] Massif du prototype : Chartreuse et Vercors.
- [x] Application ouverte à tous ou à un cercle : V0 en démo privée, V1 avec 10 à 20 alpha users.
- [x] Contributions : V0 saisie par l'éditeur seul, V1 par comptes contributeurs.
- [x] Positionnement face à Visorando : cible trail et VTT, conseils adaptés, observations de terrain (T30).
- [x] Export vers une montre : abandonné.

**Ouvertes**

- [ ] Quelles sources de zones existent réellement pour la Chartreuse et le Vercors (RPG, enquêtes pastorales) ?
- [ ] Quelles conditions de réutilisation pour Map Patou ? (contacter le responsable)
- [ ] Quelle relation avec Pasto'rando ?
- [ ] Qui relit les conseils sur les patous ? (à trouver pour la V1)
- [ ] Strava, Komoot ou Garmin affichent-ils déjà des données pastorales ?
- [ ] Quel rayon de halo par espèce ? (à fixer avec un berger)
- [ ] Quel critère d'activité pour passer de la V1 à la V2 ?
- [ ] Qui valide le rôle berger en V2 ?
- [ ] Témoignages : saisis par l'éditeur avec accord écrit dès la V1, ou seulement en V2 ?
