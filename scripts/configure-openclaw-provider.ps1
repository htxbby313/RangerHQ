param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("openai", "openrouter", "gemini", "google", "kimi", "moonshot", "minimax", "qwen", "glm", "anthropic")]
  [string]$Provider,

  [Parameter(Mandatory = $true)]
  [string]$Model,

  [string]$ApiKey,

  [string]$ApiKeyEnv,

  [string]$ConfigDir = "$env:USERPROFILE\.openclaw",

  [switch]$KeepOldModel
)

$ErrorActionPreference = "Stop"

function Read-JsonFile($Path, $Fallback) {
  if (Test-Path -LiteralPath $Path) {
    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  }

  return $Fallback
}

function Ensure-ObjectProperty($Object, [string]$Name, $Value) {
  if ($null -eq $Object.PSObject.Properties[$Name]) {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
  }
}

function Write-JsonFile($Path, $Value) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }

  $Value | ConvertTo-Json -Depth 40 | Set-Content -LiteralPath $Path -Encoding utf8
  Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json | Out-Null
}

function New-Backup($Path) {
  if (Test-Path -LiteralPath $Path) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Copy-Item -LiteralPath $Path -Destination "$Path.rangerhq-provider-$stamp.bak"
  }
}

$providerMap = @{
  google = "gemini"
  glm = "zai"
  qwen = "modelstudio"
}

$authProvider = if ($providerMap.ContainsKey($Provider)) { $providerMap[$Provider] } else { $Provider }
$expectedPrefix = if ($Provider -eq "google") { "google" } else { $Provider }
if (-not $Model.StartsWith("$expectedPrefix/")) {
  throw "Model must use the provider/model pattern and start with '$expectedPrefix/'. Received '$Model'."
}

if (-not $ApiKey) {
  $envName = if ($ApiKeyEnv) {
    $ApiKeyEnv
  } else {
    switch ($Provider) {
      "openai" { "OPENAI_API_KEY" }
      "openrouter" { "OPENROUTER_API_KEY" }
      "gemini" { "GEMINI_API_KEY" }
      "google" { "GEMINI_API_KEY" }
      "kimi" { "KIMI_CODE_API_KEY" }
      "moonshot" { "MOONSHOT_API_KEY" }
      "minimax" { "MINIMAX_API_KEY" }
      "qwen" { "MODELSCOPE_API_KEY" }
      "glm" { "ZAI_API_KEY" }
      "anthropic" { "ANTHROPIC_API_KEY" }
    }
  }

  $ApiKey = [Environment]::GetEnvironmentVariable($envName, "Process")
  if (-not $ApiKey) { $ApiKey = [Environment]::GetEnvironmentVariable($envName, "User") }
  if (-not $ApiKey) { $ApiKey = [Environment]::GetEnvironmentVariable($envName, "Machine") }
}

if (-not $ApiKey) {
  throw "No API key was supplied. Pass -ApiKey, set -ApiKeyEnv, or set the provider API key environment variable before running this script."
}

$configPath = Join-Path $ConfigDir "openclaw.json"
$authPath = Join-Path $ConfigDir "agents\main\agent\auth-profiles.json"

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "OpenClaw config not found: $configPath"
}

$config = Read-JsonFile $configPath ([pscustomobject]@{})
$authProfiles = Read-JsonFile $authPath ([pscustomobject]@{ version = 1; profiles = [pscustomobject]@{} })

Ensure-ObjectProperty $config "plugins" ([pscustomobject]@{})
Ensure-ObjectProperty $config.plugins "entries" ([pscustomobject]@{})
Ensure-ObjectProperty $config "auth" ([pscustomobject]@{})
Ensure-ObjectProperty $config.auth "profiles" ([pscustomobject]@{})
Ensure-ObjectProperty $config "agents" ([pscustomobject]@{})
Ensure-ObjectProperty $config.agents "defaults" ([pscustomobject]@{})
Ensure-ObjectProperty $config.agents.defaults "model" ([pscustomobject]@{})
Ensure-ObjectProperty $config.agents.defaults "models" ([pscustomobject]@{})
Ensure-ObjectProperty $authProfiles "version" 1
Ensure-ObjectProperty $authProfiles "profiles" ([pscustomobject]@{})

$profileName = "$authProvider`:default"

if ($null -eq $config.plugins.entries.PSObject.Properties[$authProvider]) {
  $config.plugins.entries | Add-Member -NotePropertyName $authProvider -NotePropertyValue ([pscustomobject]@{ enabled = $true })
} else {
  $config.plugins.entries.$authProvider.enabled = $true
}

if ($null -eq $config.auth.profiles.PSObject.Properties[$profileName]) {
  $config.auth.profiles | Add-Member -NotePropertyName $profileName -NotePropertyValue ([pscustomobject]@{
      provider = $authProvider
      mode = "api_key"
    })
} else {
  $config.auth.profiles.$profileName.provider = $authProvider
  $config.auth.profiles.$profileName.mode = "api_key"
}

if ($KeepOldModel) {
  if ($null -eq $config.agents.defaults.models.PSObject.Properties[$Model]) {
    $config.agents.defaults.models | Add-Member -NotePropertyName $Model -NotePropertyValue ([pscustomobject]@{})
  }
} else {
  $config.agents.defaults.models = [pscustomobject]@{}
  $config.agents.defaults.models | Add-Member -NotePropertyName $Model -NotePropertyValue ([pscustomobject]@{})
}
$config.agents.defaults.model.primary = $Model

if ($null -eq $authProfiles.profiles.PSObject.Properties[$profileName]) {
  $authProfiles.profiles | Add-Member -NotePropertyName $profileName -NotePropertyValue ([pscustomobject]@{
      type = "api_key"
      provider = $authProvider
      key = $ApiKey
    })
} else {
  $authProfiles.profiles.$profileName.type = "api_key"
  $authProfiles.profiles.$profileName.provider = $authProvider
  $authProfiles.profiles.$profileName.key = $ApiKey
}

New-Backup $configPath
New-Backup $authPath
Write-JsonFile $configPath $config
Write-JsonFile $authPath $authProfiles

Write-Output "OpenClaw provider configured."
Write-Output "Config: $configPath"
Write-Output "Auth profiles: $authPath"
Write-Output "Primary model: $Model"
Write-Output "Allowlisted models: $((($config.agents.defaults.models.PSObject.Properties | ForEach-Object { $_.Name }) -join ', '))"
