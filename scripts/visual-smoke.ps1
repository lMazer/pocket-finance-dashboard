param(
  [string]$FrontendUrl = "http://localhost:34200",
  [string]$BackendUrl = "http://localhost:38080",
  [string]$OutDir = ".\docs\prints\smoke"
)

$ErrorActionPreference = "Stop"

function Resolve-ChromePath {
  $isWindowsHost = (($PSVersionTable.PSEdition -eq "Desktop") -or ($env:OS -eq "Windows_NT") -or $IsWindows)

  if ($isWindowsHost) {
    $candidates = @(
      "C:\Program Files\Google\Chrome\Application\chrome.exe",
      "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
      "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
      "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    )

    foreach ($candidate in $candidates) {
      if (Test-Path $candidate) {
        return $candidate
      }
    }
  } else {
    $commands = @(
      "google-chrome",
      "google-chrome-stable",
      "chromium-browser",
      "chromium",
      "microsoft-edge",
      "microsoft-edge-stable"
    )

    foreach ($commandName in $commands) {
      $command = Get-Command $commandName -ErrorAction SilentlyContinue
      if ($command -and $command.Path) {
        return $command.Path
      }
    }
  }

  throw "Nao foi encontrado Chrome/Edge para captura headless neste ambiente."
}

function Capture-Screenshot {
  param(
    [string]$BrowserPath,
    [string]$Url,
    [string]$FilePath,
    [string]$Viewport
  )

  & $BrowserPath --headless=new --disable-gpu --hide-scrollbars --window-size=$Viewport --screenshot=$FilePath $Url | Out-Null
}

function Check-Http {
  param(
    [string]$Label,
    [string]$Url
  )

  $status = (Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 20).StatusCode
  Write-Host ("[{0}] {1} -> {2}" -f (Get-Date -Format "HH:mm:ss"), $Label, $status)
}

$browser = Resolve-ChromePath
New-Item -ItemType Directory -Force $OutDir | Out-Null
$outAbs = (Resolve-Path $OutDir).Path
$desktopDir = Join-Path $outAbs "desktop"
$mobileDir = Join-Path $outAbs "mobile"
New-Item -ItemType Directory -Force $desktopDir | Out-Null
New-Item -ItemType Directory -Force $mobileDir | Out-Null

$targets = @(
  @{ Name = "login"; Url = "$FrontendUrl/login" },
  @{ Name = "dashboard"; Url = "$FrontendUrl/dashboard" },
  @{ Name = "transactions"; Url = "$FrontendUrl/transactions" },
  @{ Name = "categories"; Url = "$FrontendUrl/categories" },
  @{ Name = "budgets"; Url = "$FrontendUrl/budgets" },
  @{ Name = "reports"; Url = "$FrontendUrl/reports" },
  @{ Name = "swagger"; Url = "$BackendUrl/swagger-ui/index.html" }
)

foreach ($target in $targets) {
  Capture-Screenshot -BrowserPath $browser -Url $target.Url -FilePath (Join-Path $desktopDir "$($target.Name).png") -Viewport "1440,900"
  Capture-Screenshot -BrowserPath $browser -Url $target.Url -FilePath (Join-Path $mobileDir "$($target.Name).png") -Viewport "390,844"
}

Check-Http -Label "Frontend" -Url "$FrontendUrl/"
Check-Http -Label "Dashboard" -Url "$FrontendUrl/dashboard"
Check-Http -Label "Transactions" -Url "$FrontendUrl/transactions"
Check-Http -Label "Categories" -Url "$FrontendUrl/categories"
Check-Http -Label "Budgets" -Url "$FrontendUrl/budgets"
Check-Http -Label "Reports" -Url "$FrontendUrl/reports"
Check-Http -Label "Health" -Url "$BackendUrl/actuator/health"
Check-Http -Label "OpenAPI" -Url "$BackendUrl/v3/api-docs"

Write-Host ("Capturas geradas em: {0}" -f $outAbs)
