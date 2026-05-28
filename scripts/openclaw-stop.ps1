param(
  [string]$ContainerName = "RangerHQ-openclaw"
)

$ErrorActionPreference = "Stop"

$running = docker ps --filter "name=^/$ContainerName$" --format "{{.Names}}"
if ($running -eq $ContainerName) {
  docker stop --time 3 $ContainerName | Out-Null
}

Write-Output "$ContainerName stopped or not running."

