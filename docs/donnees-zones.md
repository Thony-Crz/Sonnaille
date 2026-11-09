# Zones en production : le dépôt privé et le PC

L'API Map Patou ne répond pas aux machines de GitHub (décision D4), mais elle répond à un PC en France. Ce PC récupère donc les zones chaque matin de la saison d'estive et les dépose dans un dépôt GitHub **privé**, `Sonnaille-data`. La CI du site lit ce dépôt avec un jeton en lecture seule au moment de construire le site.

```
PC (tâche planifiée, 5 h)  →  dépôt privé Sonnaille-data  →  CI (6 h, heure de Paris)  →  site
   npm run data                 pastoral-zones.geojson         jeton en lecture seule
   + contrôle des zones         (un seul commit, réécrit)      + contrôle des zones
```

- Les données ne vont jamais dans le dépôt public (D1) et n'apparaissent dans aucun journal.
- Le dépôt privé ne garde qu'un commit, réécrit chaque jour : pas d'historique des données.
- Des zones invalides ne sont jamais publiées : le site dit alors que les zones sont indisponibles.
- Si le PC est éteint, le site garde les zones de la veille ; la tâche se lance dès que le PC redémarre.
- Hors saison (novembre à mai), la tâche ne fait rien.

## Mise en place, pas à pas

Les chemins ci-dessous sont des exemples ; tout dossier durable convient (pas un dossier temporaire).

### 1. Cloner Sonnaille sur le PC

```powershell
git clone https://github.com/Thony-Crz/Sonnaille.git C:\data\git\Sonnaille
cd C:\data\git\Sonnaille
npm ci
```

Node.js 22 est nécessaire.

### 2. Créer le dépôt privé sur GitHub

GitHub → **New repository** :

- Owner : `Thony-Crz`, nom : `Sonnaille-data`
- **Private**
- Sans README, sans .gitignore, sans licence (dépôt vide)

### 3. Le cloner sur le PC

```powershell
git clone https://github.com/Thony-Crz/Sonnaille-data.git C:\data\git\Sonnaille-data
```

### 4. Premier essai, à la main

```powershell
powershell -ExecutionPolicy Bypass -File C:\data\git\Sonnaille\scripts\windows\publish-zones.ps1 -Force
```

`-Force` fait l'essai même hors saison. Attendu : « Zones valides : … zones », puis « Zones publiées ». Sur GitHub, `Sonnaille-data` contient alors `pastoral-zones.geojson`.

### 5. Créer le jeton en lecture seule

GitHub → photo de profil → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token** :

- Nom : `Sonnaille CI - lecture des zones`
- Expiration : un an au plus (noter la date pour le renouveler)
- Repository access : **Only select repositories** → `Sonnaille-data`
- Permissions → Repository permissions → **Contents : Read-only** (Metadata : Read-only s'ajoute tout seul)

Copier le jeton : GitHub ne le montre qu'une fois.

### 6. Le donner à la CI

Dépôt `Sonnaille` → **Settings** → **Secrets and variables** → **Actions** → onglet **Secrets** → **New repository secret** :

- Name : `SONNAILLE_DATA_TOKEN`
- Secret : le jeton

### 7. Planifier la publication chaque matin

```powershell
powershell -ExecutionPolicy Bypass -File C:\data\git\Sonnaille\scripts\windows\register-zones-task.ps1
```

La tâche « Sonnaille - zones Map Patou » tourne chaque jour à 5 h, avec le compte Windows courant (celui dont Git sait pousser vers GitHub). Si Windows refuse (« Accès refusé »), relancer PowerShell en administrateur.

### 8. Vérifier

Dépôt `Sonnaille` → **Actions** → **CI and deployment** → **Run workflow**. Une fois le déploiement fini, le site affiche les zones ; hors saison, elles sont grises (« pas de troupeau prévu »).

## Au quotidien

- Journal : `%LOCALAPPDATA%\Sonnaille\publish-zones.log`.
- Lancer à la main : l'étape 4 (sans `-Force` en saison).
- Renouveler le jeton avant son expiration (étape 5), puis remplacer le secret (étape 6).
- Arrêter : `Unregister-ScheduledTask -TaskName 'Sonnaille - zones Map Patou'`.
- Plus tard, un serveur en France (avec l'API des signalements, voir [hebergement.md](hebergement.md)) pourra remplacer le PC.
