# Hébergement de l'API (V1)

L'[API des signalements](api.md) est un conteneur .NET 10 et une base PostgreSQL avec PostGIS. Le site reste sur GitHub Pages. Options étudiées le 5 novembre 2026, **sans décision prise**. Les prix sont indicatifs, à vérifier : les offres gratuites changent souvent.

| Option | Pour | Contre | Coût indicatif |
|---|---|---|---|
| **A. Scaleway Serverless Containers + Neon** (Postgres avec PostGIS, région Francfort) | Données en UE, mise en veille sans trafic, image Docker déployée depuis GitHub Actions | Deux fournisseurs ; première requête lente (quelques secondes) après une veille | Proche de 0 € pour 10 à 20 alpha users |
| **B. Clever Cloud** (runtime .NET + extension PostgreSQL avec PostGIS) | Tout chez un hébergeur français, très simple, déploiement par `git push` ou Actions | Pas d'offre gratuite durable | Quelques euros à une vingtaine d'euros par mois |
| **C. Azure** (Container Apps + PostgreSQL Flexible Server, PostGIS supporté) | Le plus naturel pour .NET, région France, montée en charge facile | Plus de configuration ; base payante après la période d'essai | De 0 à environ 15 € par mois selon les crédits |
| **D. Petit VPS** (Hetzner, OVH, Scaleway) avec Docker Compose (API + PostGIS) | Le moins cher à coût fixe, contrôle total | Sauvegardes, certificats HTTPS et mises à jour à notre charge | Environ 4 à 6 € par mois |

## Recommandation pour l'alpha : A

- Pas de coût fixe, rien à maintenir.
- Neon garde la base en Europe et accepte PostGIS. Les signalements ne contiennent pas de données personnelles, mais rester en UE évite toute question RGPD.
- Le temps de réveil après une veille ne gêne pas pour publier un signalement.
- Si l'usage grandit en V1, passage facile vers B ou C : l'API est un simple conteneur, la base du Postgres standard.

## Dans tous les cas

À préparer dans le dépôt :

- un `Dockerfile` pour l'API ;
- un job de déploiement dans `.github/workflows/ci-deploy.yml`, lancé seulement si les tests passent.

À faire par le propriétaire du projet (jamais par l'IA ni dans le dépôt) :

- créer les comptes chez l'hébergeur ;
- créer les secrets `ConnectionStrings__Sightings` et `Moderation__Key`, et les identifiants de déploiement ;
- ajouter la variable de dépôt `SIGHTINGS_API_URL` (adresse publique de l'API), pour que le site l'utilise.

En attendant, le [mode démo](demo/README.md) montre tout le parcours sans API.
