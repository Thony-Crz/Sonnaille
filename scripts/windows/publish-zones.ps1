<#
.SYNOPSIS
  Fetches the day's pastoral zones from Map Patou and publishes them to the private data repository.

.DESCRIPTION
  Run each morning of the grazing season by a scheduled task (register-zones-task.ps1), on a PC
  that can reach Map Patou (GitHub runners cannot: docs/decisions.md, D4).
  1. Updates the Sonnaille clone and fetches the zones (npm run data).
  2. Checks them (scripts/check-zones.ts): invalid zones are never published.
  3. Copies them to the clone of the private repository, as a single commit rewritten each day
     (the repository keeps no history of the data), and pushes it.
  The data never goes to the public repository (D1) and is never written to the log.
  Windows PowerShell 5.1 compatible. Guide: docs/donnees-zones.md.

.EXAMPLE
  .\publish-zones.ps1 -Sonnaille C:\data\git\Sonnaille -DataRepo C:\data\git\Sonnaille-data -Force
#>
param(
  [string]$Sonnaille = 'C:\data\git\Sonnaille',
  [string]$DataRepo = 'C:\data\git\Sonnaille-data',
  # Runs even outside the grazing season (June to October), e.g. for a first try.
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$logDir = Join-Path $env:LOCALAPPDATA 'Sonnaille'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Start-Transcript -Path (Join-Path $logDir 'publish-zones.log') -Append | Out-Null

function Invoke-Step([string]$What, [scriptblock]$Command) {
  Write-Host "-> $What"
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$What : échec (code $LASTEXITCODE)." }
}

try {
  $month = (Get-Date).Month
  if (-not $Force -and ($month -lt 6 -or $month -gt 10)) {
    Write-Host "Hors saison d'estive (juin à octobre) : rien à publier."
    return
  }

  Push-Location $Sonnaille
  try {
    $lock = 'package-lock.json'
    $before = (Get-FileHash $lock).Hash
    Invoke-Step 'Mise à jour de Sonnaille' { git pull --quiet --ff-only }
    if (-not (Test-Path 'node_modules') -or (Get-FileHash $lock).Hash -ne $before) {
      Invoke-Step 'Installation des dépendances' { npm ci --no-audit --no-fund --loglevel=error }
    }
    Invoke-Step 'Récupération des zones chez Map Patou' { npm run --silent data }
    Invoke-Step 'Contrôle des zones' { npx --no-install tsx scripts/check-zones.ts }
  }
  finally { Pop-Location }

  $source = Join-Path $Sonnaille 'public\data\pastoral-zones.geojson'
  Copy-Item $source (Join-Path $DataRepo 'pastoral-zones.geojson') -Force

  Push-Location $DataRepo
  try {
    $message = "Zones Map Patou du $(Get-Date -Format 'yyyy-MM-dd')"
    Invoke-Step 'Préparation du commit' { git add pastoral-zones.geojson }
    git rev-parse --verify --quiet HEAD | Out-Null
    if ($LASTEXITCODE -eq 0) {
      # One commit only, rewritten each day: no history of the data.
      Invoke-Step 'Commit' { git commit --quiet --amend --message $message }
    }
    else {
      Invoke-Step 'Premier commit' { git commit --quiet --message $message }
    }
    Invoke-Step 'Envoi au dépôt privé' { git push --quiet --force origin HEAD:main }
  }
  finally { Pop-Location }

  Write-Host "Zones publiées : le site les affichera après le prochain déploiement (chaque matin à 6 h, heure de Paris)."
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
