param(
  [ValidateSet("frontend", "backend", "db")]
  [string]$Service = "backend",
  [string]$ComposeFile = "compose.dev.yml",
  [switch]$NoFollow,
  [int]$Tail = 100
)

$ErrorActionPreference = "Stop"

$argsList = @("compose", "-f", $ComposeFile, "logs")
if (-not $NoFollow) {
  $argsList += "-f"
}
$argsList += "--tail"
$argsList += "$Tail"
$argsList += $Service

Write-Host "Executando: docker $($argsList -join ' ')"
docker @argsList
