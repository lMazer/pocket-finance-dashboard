param(
  [string]$FrontendUrl = "http://localhost:34200",
  [string]$BackendUrl = "http://localhost:38080"
)

$ErrorActionPreference = "Stop"

function Test-Http200 {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Name
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -ne 200) {
      throw "$Name retornou status $($response.StatusCode)"
    }
    Write-Host "[OK] $Name -> $Url"
  }
  catch {
    Write-Error "[FAIL] $Name -> $Url :: $($_.Exception.Message)"
    throw
  }
}

Write-Host "Executando smoke test da stack Docker dev..."

Test-Http200 -Name "Frontend" -Url "$FrontendUrl/dashboard"
Test-Http200 -Name "Backend health" -Url "$BackendUrl/actuator/health"
Test-Http200 -Name "OpenAPI" -Url "$BackendUrl/v3/api-docs"

Write-Host "Smoke test concluido com sucesso."
