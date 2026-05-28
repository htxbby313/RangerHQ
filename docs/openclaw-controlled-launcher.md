# OpenClaw Controlled Launcher

Ranger HQ must not reuse the existing `RangerHQ` Docker container for live workflows. That container was created with loose runtime settings and exited with code `78`.

The controlled gateway container is:

`RangerHQ-openclaw`

## Gateway vs Agent Sandboxes

The OpenClaw gateway is a local control process. It needs a localhost port so Ranger HQ can inspect and control it.

Agent sandboxes are separate. Their network and filesystem restrictions come from the verified OpenClaw host config:

`C:\Users\colem\.openclaw\openclaw.json`

That config currently sets agent sandboxes to:

- Docker backend
- `workspaceAccess: none`
- Docker network: `none`
- read-only root
- `capDrop: ["ALL"]`
- PID limit: `256`
- memory: `1g`
- CPUs: `1`

## Runtime Constraints

The controlled gateway launcher applies:

- container name: `RangerHQ-openclaw`
- image: `openclaw:latest`
- user: `nodejs`
- working directory: `/app`
- read-only root filesystem
- dropped Linux capabilities: `ALL`
- PID limit: `256`
- memory limit: `1g`
- CPU limit: `1`
- `no-new-privileges:true`
- tmpfs for `/tmp`
- Docker named volume `rangerhq-openclaw-npm-cache` for npm cache because `npx openclaw` installs and executes a large gateway package during container startup
- one-time cache volume ownership preparation to allow the container's `nodejs` user, UID `1001`, to write npm cache files
- bind mount of `C:\Users\colem\.openclaw` to `/home/nodejs/.openclaw` so OpenClaw can write runtime health/log/task state
- one-time backup of `openclaw.json` to `openclaw.json.rangerhq-backup` before launch
- gateway port bound to Windows loopback only: `127.0.0.1:18789`
- OpenClaw gateway bind override: `--bind lan`, required so Docker port publishing can reach the gateway from Windows loopback

## Backend Routes

- `GET /api/openclaw/status`
- `POST /api/openclaw/launch`
- `POST /api/openclaw/stop`

Launch is blocked while the Ranger HQ kill switch is active.

When the kill switch is activated, Ranger HQ attempts to stop the controlled OpenClaw gateway container.

## Manual Scripts

Manual launch:

```powershell
.\scripts\openclaw-launch.ps1
```

Manual stop:

```powershell
.\scripts\openclaw-stop.ps1
```

## Current Constraint

The gateway container binds a local host port. This is intentionally different from agent room sandboxes, which should default to no network. Do not loosen agent sandbox rules to make the gateway easier to run.
