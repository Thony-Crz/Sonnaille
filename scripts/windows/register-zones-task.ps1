<#
.SYNOPSIS
  Creates (or replaces) the Windows scheduled task that publishes the zones each morning.

.DESCRIPTION
  The task runs publish-zones.ps1 every day at the given time, as the current user (whose Git
  credentials push to the private repository). If the PC was off at that time, it runs as soon as
  possible afterwards. Out of the grazing season, the script does nothing.
  Remove it with: Unregister-ScheduledTask -TaskName 'Sonnaille - zones Map Patou'
  Guide: docs/donnees-zones.md.
#>
param(
  [string]$Sonnaille = 'C:\data\git\Sonnaille',
  [string]$DataRepo = 'C:\data\git\Sonnaille-data',
  # Before the site is built (06:00 Paris time in summer, see .github/workflows/ci-deploy.yml).
  [string]$At = '05:00'
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $Sonnaille 'scripts\windows\publish-zones.ps1'
if (-not (Test-Path $script)) { throw "Script introuvable : $script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Sonnaille `"$Sonnaille`" -DataRepo `"$DataRepo`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName 'Sonnaille - zones Map Patou' -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Récupère les zones pastorales Map Patou et les publie dans le dépôt privé Sonnaille-data (docs/donnees-zones.md).' `
  -Force | Out-Null

Write-Host "Tâche planifiée créée : chaque jour à $At (journal : $env:LOCALAPPDATA\Sonnaille\publish-zones.log)."
