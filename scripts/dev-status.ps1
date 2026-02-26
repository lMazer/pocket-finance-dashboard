param(
  [string]$ComposeFile = "compose.dev.yml",
  [string]$FrontendUrl = "http://localhost:34200",
  [string]$BackendUrl = "http://localhost:38080"
)

$ErrorActionPreference = "Stop"

Write-Host "== Docker Compose services =="
docker compose -f $ComposeFile ps

Write-Host ""
Write-Host "== Endpoints =="
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend:  $BackendUrl"
Write-Host "Swagger:  $BackendUrl/swagger-ui/index.html"
Write-Host "Health:   $BackendUrl/actuator/health"
Write-Host "OpenAPI:  $BackendUrl/v3/api-docs"
