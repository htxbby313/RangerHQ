param(
  [string]$ContainerName = "RangerHQ-openclaw",
  [string]$Image = "openclaw:latest",
  [string]$NpmCacheVolume = "rangerhq-openclaw-npm-cache",
  [string]$ConfigDir = "$env:USERPROFILE\.openclaw",
  [int]$Port = 18789
)

$ErrorActionPreference = "Stop"

$ConfigFile = Join-Path $ConfigDir "openclaw.json"
$BackupFile = Join-Path $ConfigDir "openclaw.json.rangerhq-backup"
if (-not (Test-Path -LiteralPath $ConfigFile)) {
  throw "OpenClaw config not found: $ConfigFile"
}
if (-not (Test-Path -LiteralPath $BackupFile)) {
  Copy-Item -LiteralPath $ConfigFile -Destination $BackupFile
}

$existing = docker ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}"
if ($existing -eq $ContainerName) {
  $running = docker ps --filter "name=^/$ContainerName$" --format "{{.Names}}"
  if ($running -eq $ContainerName) {
    Write-Output "$ContainerName is already running."
    exit 0
  }

  docker rm $ContainerName | Out-Null
}

docker volume create $NpmCacheVolume | Out-Null
docker run --rm `
  --network none `
  --user root `
  --mount "type=volume,source=$NpmCacheVolume,target=/home/nodejs/.npm" `
  --entrypoint sh `
  $Image `
  -lc "mkdir -p /home/nodejs/.npm && chown -R 1001:65533 /home/nodejs/.npm" | Out-Null

docker run -d `
  --name $ContainerName `
  --user nodejs `
  --workdir /app `
  --read-only `
  --cap-drop ALL `
  --pids-limit 256 `
  --memory 1g `
  --cpus 1 `
  --security-opt no-new-privileges:true `
  --health-cmd "wget -O- http://127.0.0.1:$Port || exit 1" `
  --health-interval 30s `
  --health-timeout 5s `
  --health-start-period 90s `
  --health-retries 5 `
  --tmpfs /tmp:rw,noexec,nosuid,size=128m `
  --mount "type=volume,source=$NpmCacheVolume,target=/home/nodejs/.npm" `
  --mount "type=bind,source=$ConfigDir,target=/home/nodejs/.openclaw" `
  -p "127.0.0.1:${Port}:${Port}" `
  $Image `
  npx openclaw gateway --port $Port --bind lan
