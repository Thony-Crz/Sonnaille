# Démo de Sonnaille (T28)

Scénario d'une dizaine de minutes pour présenter la V0 à un partenaire. Le tracé fourni est **fictif**.

## Mode démo, sans aucune API

Ouvrir **https://thony-crz.github.io/Sonnaille/?demo** (ou `http://localhost:4200/Sonnaille/?demo` en local, avec `npm run dev`). Un bandeau le signale. Tout y est fictif et rien ne quitte l'appareil :

- quatre zones fictives dans le Vercors (`public/demo/pastoral-zones.geojson`), une par cas : troupeau avec chiens, troupeau sans chiens, chevaux et ânes, troupeau prévu plus tard ;
- quelques signalements fictifs près du tracé : brebis, ânes, nid de frelons, ruches (`public/demo/observations.geojson`) ;
- la carte s'ouvre le 15 juillet 2026, quand les troupeaux fictifs sont là (`?demo&date=2026-11-15` pour un autre jour) ;
- « Publier » envoie à un serveur simulé dans le navigateur, qui valide aussitôt : le signalement apparaît sur la carte comme s'il avait été modéré. Les signalements de la démo restent séparés des vrais ;
- le bandeau propose le [tracé de démo (GPX)](../../public/demo/hauts-plateaux-fictif.gpx), « Recommencer » (efface les signalements de la démo) et « Quitter la démo ».

Quand les vraies zones sont indisponibles (D4), la légende propose « Voir la démo ».

## Démo avec les vraies données (en local)

1. Récupérer les zones d'un jour d'été (une seule requête à Map Patou) : `MAP_PATOU_DATE=2026-07-15 npm run data`, puis `npm run dev`.
2. Ouvrir `http://localhost:4200/Sonnaille/?date=2026-07-15`.
3. Utiliser le même tracé de démo.

## Déroulé

1. **La carte** (1 min) : la Chartreuse et le Vercors, les trois couleurs de la légende, la source et la date des données. Changer de fond : « Topographique », et cocher « Sentiers balisés ».
2. **Une zone** (2 min) : toucher une zone rouille (troupeau avec chiens). La fiche donne la période, l'espèce, les chiens et les bons réflexes. Passer de « À pied » à « À VTT » : les conseils changent.
3. **Préparer une sortie** (3 min) : importer le GPX fictif (lien dans le bandeau en mode démo). « Votre sortie » liste les zones traversées, au km près, avec les conseils du cas le plus prudent. Changer la date pour novembre : même zone, plus de troupeau prévu.
4. **Les signalements** (2 min) : sur la carte, chaque signalement a son pictogramme (brebis, vache, chèvre, cheval, âne, ruche, abeille, guêpe, frelon), avec un petit chien quand des chiens de protection ont été vus ; les zones avec chiens portent aussi le chien. Toucher le nid de frelons : la fiche donne la date, la zone de prudence et le bon réflexe. La légende, rubrique « Signalements », explique chaque pictogramme.
5. **Après la sortie** (2 min) : « Signaler animaux, ruches ou nids », toucher la carte, choisir « Un nid de guêpes » ou « Ânes », enregistrer, puis « Publier » : en mode démo, le pictogramme apparaît aussitôt sur la carte. « Votre sortie » liste ce qui est signalé près du tracé, avec le bon réflexe.
6. **Comprendre** (1 min) : le rôle du chien de protection, tous les conseils, les sources.

## Messages clés

- Le tracé GPX reste sur l'appareil : rien n'est envoyé.
- Les calendriers viennent de Map Patou : Sonnaille les rend utiles au moment de préparer une sortie, sans les dupliquer.
- Les conseils viennent de Pasto Kézako ; ils attendent la relecture d'un professionnel du pastoralisme.
- Aucun nom de berger, aucun texte libre sur les chiens.
