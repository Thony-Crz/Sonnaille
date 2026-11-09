# Déployer l'API : Scaleway et Neon, pas à pas

L'API (zones pastorales et signalements, [api.md](api.md)) tourne dans un conteneur **Scaleway Serverless Containers** à Paris ; sa base est un PostgreSQL avec PostGIS chez **Neon**, à Francfort (option A de [hebergement.md](hebergement.md)). La CI construit l'image et la déploie à chaque push sur `main`, dès que les secrets ci-dessous existent.

Comptes, clés et secrets se créent à la main par le propriétaire du projet : jamais dans le dépôt.

```
site (GitHub Pages) ──► API (Scaleway, Paris) ──► Map Patou (une fois par jour)
                              │
                              └──► base PostGIS (Neon, Francfort)
```

Le conteneur s'éteint quand personne ne l'utilise : la première visite après une pause prend quelques secondes. Les zones restent à jour grâce aux visites (la première du jour lance la récupération chez Map Patou).

## 1. La base chez Neon

1. Créer un compte sur neon.tech, puis un projet `sonnaille`, région **AWS Europe Central 1 (Frankfurt)**.
2. Dans **SQL Editor**, lancer `CREATE EXTENSION IF NOT EXISTS postgis;` (l'API le fait aussi au démarrage).
3. **Connect** → copier la chaîne de connexion `postgresql://…?sslmode=require` (connexion directe, sans « pooler »). C'est un secret.

## 2. Le registre d'images chez Scaleway

1. Créer un compte sur scaleway.com et garder le projet par défaut.
2. **Container Registry** → **Create namespace** : région **Paris (fr-par)**, nom `sonnaille`, **privé**.

## 3. Le conteneur

**Serverless Containers** → **Create namespace** (région Paris, nom `sonnaille`), puis **Create container** :

- Image : pour la création seulement, une image publique de test, par exemple `mcr.microsoft.com/dotnet/samples:aspnetapp` ; la CI la remplacera par celle de Sonnaille.
- Nom : `sonnaille-api` ; port : **8080** ; mémoire : 512 Mo ; mise à l'échelle : minimum **0**, maximum **1** (pour borner le coût).
- Confidentialité : **public** (le site l'appelle).
- Variables d'environnement :
  - `Cors__Origins__0` = `https://thony-crz.github.io`
- Secrets (variables chiffrées) :
  - `ConnectionStrings__Sightings` = la chaîne de connexion Neon de l'étape 1 (l'API accepte ce format d'URL) ;
  - `Moderation__Key` = une longue phrase de passe aléatoire, pour les modérateurs.

Noter ensuite, dans les réglages du conteneur :

- son **identifiant** (Container ID) ;
- son **adresse** (Endpoint), du type `https://sonnaille-xxxx-sonnaille-api.functions.fnc.fr-par.scw.cloud`.

## 4. La clé pour la CI

**IAM** → **Applications** → **Create application** `sonnaille-ci`, avec une politique qui donne, sur le projet, **ContainerRegistryFullAccess** et **ContainersFullAccess**. Puis **API keys** → **Generate API key** pour cette application : garder la **clé secrète** (Secret Key), montrée une seule fois.

## 5. GitHub

Dépôt `Sonnaille` → **Settings** → **Secrets and variables** → **Actions** :

- onglet **Secrets** : `SCW_SECRET_KEY` = la clé secrète de l'étape 4 ;
- onglet **Variables** :
  - `SCW_REGISTRY_NAMESPACE` = `sonnaille` ;
  - `SCW_CONTAINER_ID` = l'identifiant du conteneur ;
  - `SONNAILLE_API_URL` = l'adresse du conteneur, sans `/` à la fin.

## 6. Premier déploiement et vérifications

1. **Actions** → **CI and deployment** → **Run workflow**. Le job `deploy-api` pousse l'image et redéploie le conteneur ; le job `test` reconstruit le site avec l'adresse de l'API.
2. Ouvrir `<adresse de l'API>/api/health` : la page affiche `ok`.
3. **Le test décisif** : ouvrir `<adresse de l'API>/api/zones`. La première fois, l'API va chercher les zones chez Map Patou (quelques secondes), puis affiche le GeoJSON. Map Patou ne répond pas aux machines de GitHub (D4) : si la réponse est `503 Zones pastorales indisponibles`, regarder les journaux du conteneur (Scaleway → conteneur → **Logs**) ; « Map Patou injoignable » veut dire que Map Patou refuse aussi Scaleway, et il faudra une autre piste.
4. Ouvrir le site : les zones du jour apparaissent, avec « Source : Map Patou » sous la légende.

## Au quotidien

- Chaque push sur `main` redéploie l'API (après ses tests) et le site.
- Coût : Scaleway et Neon ont une offre gratuite mensuelle qui suffit pour l'alpha ; à vérifier dans leurs pages de prix, qui changent souvent.
- Changer un secret (base, clé de modérateur) : dans les réglages du conteneur Scaleway, puis redéployer.
- Arrêter : passer le maximum du conteneur à 0, ou le supprimer.
