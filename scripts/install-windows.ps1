$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvPath = Join-Path $ProjectRoot ".env"

function Set-EnvValue([string]$Name, [string]$Value) {
  $content = Get-Content -Raw -Path $EnvPath
  $pattern = "(?m)^$([regex]::Escape($Name))=.*$"
  $line = "$Name=$Value"
  if ([regex]::IsMatch($content, $pattern)) {
    $content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $line })
  } else {
    $content = $content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine
  }
  Set-Content -Path $EnvPath -Value $content -NoNewline
}

function Read-SecureText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Test-Endpoint([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
  } catch {
    return $false
  }
}

function Get-EnvValue([string]$Name, [string]$DefaultValue) {
  $content = Get-Content -Raw -Path $EnvPath
  $match = [regex]::Match($content, "(?m)^$([regex]::Escape($Name))=(.*)$")
  if ($match.Success -and -not [string]::IsNullOrWhiteSpace($match.Groups[1].Value)) {
    return $match.Groups[1].Value.Trim()
  }
  return $DefaultValue
}

function Test-OllamaModel([string]$Url, [string]$ModelName) {
  try {
    $result = Invoke-RestMethod -Uri $Url -TimeoutSec 3
    foreach ($model in $result.models) {
      $name = if ($model.name) { $model.name } else { $model.model }
      if ($name -eq $ModelName -or $name.StartsWith($ModelName + ":")) {
        return $true
      }
    }
  } catch {
    return $false
  }
  return $false
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker não foi encontrado. Instale o Docker Desktop e execute este instalador novamente."
}

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Compose não está disponível. Atualize ou inicie o Docker Desktop."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "O Docker Desktop está instalado, mas não está iniciado. Abra-o e tente novamente."
}

if (-not (Test-Path $EnvPath)) {
  Copy-Item (Join-Path $ProjectRoot ".env.example") $EnvPath
}

$envContent = Get-Content -Raw -Path $EnvPath
$keyMatch = [regex]::Match($envContent, "(?m)^OPENAI_API_KEY=(.*)$")
$needsProviderChoice = -not $keyMatch.Success -or $keyMatch.Groups[1].Value -eq "sk-your-openai-api-key"

if ($needsProviderChoice) {
  Write-Host "Escolha o provedor de IA. A chave é armazenada apenas no arquivo .env local."
  $apiKey = Read-SecureText "Chave OpenAI (pressione Enter para usar apenas IA local)"

  if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
    Set-EnvValue "OPENAI_API_KEY" $apiKey
    Set-EnvValue "AI_PROVIDER" "openai"
    $apiKey = $null
  } else {
    $ollamaBase = (Get-EnvValue "OLLAMA_BASE_URL" "http://host.docker.internal:11434").TrimEnd("/")
    $sttBase = (Get-EnvValue "LOCAL_STT_BASE_URL" "http://host.docker.internal:8000/v1").TrimEnd("/")
    $ttsBase = (Get-EnvValue "LOCAL_TTS_BASE_URL" "http://host.docker.internal:8880/v1").TrimEnd("/")
    $ollama = $ollamaBase -replace "^http://host\.docker\.internal", "http://localhost"
    $stt = $sttBase -replace "^http://host\.docker\.internal", "http://localhost"
    $tts = $ttsBase -replace "^http://host\.docker\.internal", "http://localhost"
    $ollamaModel = Get-EnvValue "OLLAMA_MODEL" "llama3.1"
    $missing = @()
    if (-not (Test-OllamaModel "$ollama/api/tags" $ollamaModel)) { $missing += "Ollama com o modelo $ollamaModel" }
    if (-not (Test-Endpoint "$stt/models")) { $missing += "transcrição local ($stt)" }
    if (-not (Test-Endpoint "$tts/models")) { $missing += "voz local ($tts)" }
    if ($missing.Count -gt 0) {
      throw "Para instalar sem chave OpenAI, inicie os serviços locais necessários: $($missing -join ', '). Configure seus endereços no .env e execute novamente."
    }
    Set-EnvValue "OPENAI_API_KEY" ""
    Set-EnvValue "AI_PROVIDER" "ollama"
  }
}

Push-Location $ProjectRoot
try {
  Write-Host "Construindo e iniciando o Cariockko..."
  docker compose up -d --build
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose falhou ao iniciar. Revise as mensagens acima."
  }
} finally {
  Pop-Location
}

$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 2
  }
}

if (-not $ready) {
  throw "Os containers iniciaram, mas a interface não respondeu em http://localhost:3000. Verifique com 'docker compose logs'."
}

Start-Process "http://localhost:3000"
Write-Host "Cariockko está aberto em http://localhost:3000"
