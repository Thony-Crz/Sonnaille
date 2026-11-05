# Démo de Sonnaille (T28)

Scénario d'une dizaine de minutes pour présenter la V0 à un partenaire. Le tracé fourni est **fictif**.

## Avant la démo

1. En local, récupérer les zones d'un jour d'été (une seule requête à Map Patou) :
   `MAP_PATOU_DATE=2026-07-15 npm run data`, puis `npm run dev`.
2. Ouvrir `http://localhost:5173/Sonnaille/?date=2026-07-15` : la carte montre les troupeaux prévus ce jour-là.
3. Garder sous la main [`hauts-plateaux-fictif.gpx`](hauts-plateaux-fictif.gpx).

Le site en ligne n'affiche pas les zones tant que l'API Map Patou n'est pas joignable depuis la CI (décision D4) : faire la démo en local.

## Déroulé

1. **La carte** (1 min) : la Chartreuse et le Vercors, les trois couleurs de la légende, la source et la date des données. Changer de fond : « Topographique », et cocher « Sentiers balisés ».
2. **Une zone** (2 min) : toucher une zone rouille (troupeau avec chiens). La fiche donne la période, l'espèce, les chiens et les bons réflexes. Passer de « À pied » à « À VTT » : les conseils changent.
3. **Préparer une sortie** (3 min) : importer le GPX fictif. « Votre sortie » liste les zones traversées, au km près, avec les conseils du cas le plus prudent. Changer la date pour novembre : même zone, plus de troupeau prévu.
4. **Après la sortie** (2 min) : « Signaler des animaux vus », toucher la carte, choisir « Ânes », enregistrer. Le point violet apparaît et reste après rechargement (« Mes signalements »). Montrer aussi la variante au kilomètre du tracé dans « Votre sortie », puis « Publier ».
5. **Comprendre** (1 min) : le rôle du chien de protection, tous les conseils, les sources.

## Messages clés

- Le tracé GPX reste sur l'appareil : rien n'est envoyé.
- Les calendriers viennent de Map Patou : Sonnaille les rend utiles au moment de préparer une sortie, sans les dupliquer.
- Les conseils viennent de Pasto Kézako ; ils attendent la relecture d'un professionnel du pastoralisme.
- Aucun nom de berger, aucun texte libre sur les chiens.
