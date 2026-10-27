# Cariockko installer for Windows.
#
# Install or update (downloads the latest published release), in PowerShell:
#   irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1 | iex
#
# Uninstall:
#   & ([scriptblock]::Create((irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1))) -Uninstall
#
# Optional environment variables:
#   CARIOCKKO_DIR          Installation folder (default: %LOCALAPPDATA%\Programs\Cariockko)
#   CARIOCKKO_VERSION      Release tag to install, e.g. v0.2.0 (default: latest release)
#   OPENAI_API_KEY         Use this key without asking for it
#   CARIOCKKO_AI_PROVIDER  Set to "ollama" to choose local AI without asking
#   CARIOCKKO_DELETE_DATA  Set to 1 to delete lessons and audio when uninstalling
#   CARIOCKKO_NO_BROWSER   Set to 1 to skip opening the browser
#   CARIOCKKO_SOURCE_DIR   Install from a local copy of the repository
#
# Keep this file ASCII-only. GitHub serves release assets without a charset, so
# Windows PowerShell would garble accented letters; write them as \u00e3 inside
# single-quoted strings passed to Text.

param([switch]$Uninstall)

function Install-Cariockko {
  param([switch]$Uninstall)

  $ErrorActionPreference = "Stop"
  $ProgressPreference = "SilentlyContinue"
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

  $repo = "Joshpcbrrj/cariockko"
  $marker = ".cariockko-version"
  $installDir = if ($env:CARIOCKKO_DIR) { $env:CARIOCKKO_DIR } else { Join-Path $env:LOCALAPPDATA "Programs\Cariockko" }
  # Files kept when the code is replaced: local settings and the Inno Setup uninstaller.
  $preserved = @(".env", $marker, "unins*")

  function Text([string]$Value) {
    return [regex]::Replace($Value, "\\u([0-9a-fA-F]{4})", [System.Text.RegularExpressions.MatchEvaluator]{
      param($match)
      [string][char][Convert]::ToInt32($match.Groups[1].Value, 16)
    })
  }

  function Test-OwnInstallation {
    if (-not (Test-Path $installDir)) { return $true }
    if (-not (Get-ChildItem -Force $installDir | Select-Object -First 1)) { return $true }
    return (Test-Path (Join-Path $installDir $marker)) -or (Test-Path (Join-Path $installDir "unins*.exe"))
  }

  function Remove-InstalledFiles([string[]]$Keep) {
    Get-ChildItem -Force $installDir |
      Where-Object { $name = $_.Name; -not ($Keep | Where-Object { $name -like $_ }) } |
      Remove-Item -Recurse -Force
  }

  if ($Uninstall) {
    Write-Host (Text 'Cariockko - desinstala\u00e7\u00e3o') -ForegroundColor Cyan
    if (-not (Test-Path $installDir) -or -not (Test-OwnInstallation)) {
      throw ((Text 'Nenhuma instala\u00e7\u00e3o do Cariockko encontrada em {0}.') -f $installDir)
    }

    $deleteData = $env:CARIOCKKO_DELETE_DATA -eq "1"
    if (-not $env:CARIOCKKO_DELETE_DATA) {
      $answer = Read-Host (Text 'Apagar tamb\u00e9m as li\u00e7\u00f5es, \u00e1udios e progresso salvos? [s/N]')
      $deleteData = $answer -match "^(s|sim)$"
    }

    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    Push-Location $installDir
    try {
      if ($deleteData) { docker compose down -v --remove-orphans } else { docker compose down --remove-orphans }
    } finally {
      Pop-Location
      $ErrorActionPreference = $previous
    }

    if ($deleteData) {
      Remove-InstalledFiles @("unins*")
      if (-not (Get-ChildItem -Force $installDir | Select-Object -First 1)) { Remove-Item -Force $installDir }
      Write-Host "Cariockko removido, incluindo os dados." -ForegroundColor Green
    } else {
      # The data volumes only work with the passwords in .env, so keep it for a reinstall.
      Remove-InstalledFiles $preserved
      Write-Host ((Text 'Cariockko removido. Os dados e o arquivo {0} foram mantidos para uma futura reinstala\u00e7\u00e3o.') -f (Join-Path $installDir ".env")) -ForegroundColor Green
    }
    if (Get-ChildItem -Force $installDir -Filter "unins*.exe" -ErrorAction SilentlyContinue) {
      Write-Host (Text 'Para remover tamb\u00e9m os atalhos, desinstale o Cariockko em Configura\u00e7\u00f5es > Aplicativos.')
    }
    return
  }

  Write-Host "Cariockko - instalador" -ForegroundColor Cyan

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw (Text 'Docker n\u00e3o encontrado. Instale o Docker Desktop (https://www.docker.com/products/docker-desktop/) e execute este comando novamente.')
  }
  if (-not (Test-OwnInstallation)) {
    throw ((Text 'A pasta {0} j\u00e1 existe e n\u00e3o foi criada por este instalador. Escolha outra pasta com $env:CARIOCKKO_DIR.') -f $installDir)
  }

  $version = $env:CARIOCKKO_VERSION
  if (-not $version -and -not $env:CARIOCKKO_SOURCE_DIR) {
    try {
      $version = (Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest").tag_name
    } catch {
      throw ((Text 'N\u00e3o foi poss\u00edvel consultar a \u00faltima vers\u00e3o do Cariockko no GitHub: {0}') -f $_.Exception.Message)
    }
  }
  if (-not $version) { $version = "local" }

  $staging = Join-Path ([IO.Path]::GetTempPath()) ("cariockko-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $staging | Out-Null
  try {
    Write-Host "Baixando o Cariockko $version para $installDir..."
    if ($env:CARIOCKKO_SOURCE_DIR) {
      $source = (Resolve-Path $env:CARIOCKKO_SOURCE_DIR).Path
      robocopy $source $staging /E /XD .git node_modules .next dist test-results playwright-report /XF .env /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -ge 8) { throw ((Text 'N\u00e3o foi poss\u00edvel copiar o Cariockko de {0}.') -f $source) }
      $package = $staging
    } else {
      $zip = Join-Path $staging "cariockko.zip"
      Invoke-WebRequest "https://github.com/$repo/archive/refs/tags/$version.zip" -OutFile $zip -UseBasicParsing
      Expand-Archive $zip -DestinationPath (Join-Path $staging "extracted")
      $package = (Get-ChildItem (Join-Path $staging "extracted") -Directory | Select-Object -First 1).FullName
    }
    if (-not (Test-Path (Join-Path $package "docker-compose.yml"))) {
      throw (Text 'O pacote baixado n\u00e3o cont\u00e9m o Cariockko.')
    }

    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    # Replace the application code but keep the local configuration.
    Remove-InstalledFiles $preserved
    Get-ChildItem -Force $package | Copy-Item -Destination $installDir -Recurse -Force
    Set-Content -Path (Join-Path $installDir $marker) -Value $version -Encoding ascii
    Write-Host "Cariockko $version baixado." -ForegroundColor Green
  } finally {
    Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
  }

  $setup = Join-Path $installDir "scripts\install-windows.ps1"
  # Docker reports progress on stderr, which "Stop" would turn into an error when output is redirected.
  $ErrorActionPreference = "Continue"
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $setup
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($exitCode -ne 0) {
    throw (Text 'A configura\u00e7\u00e3o do Cariockko n\u00e3o foi conclu\u00edda. Revise as mensagens acima.')
  }
  Write-Host ""
  Write-Host (Text 'Para atualizar, execute o mesmo comando de instala\u00e7\u00e3o novamente.')
}

Install-Cariockko -Uninstall:$Uninstall
