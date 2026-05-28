# OpenClaw Config Audit

Audit date: 2026-05-26

## Locations Checked

- `C:\Program Files\Docker`
- `C:\Program Files\Docker\Docker`
- `C:\Program Files\Docker\cli-plugins`
- Docker containers, images, and volumes
- OpenClaw container/image filesystem paths under `/app`, `/home`, `/etc`, and `/usr/local`
- Host config path reported by OpenClaw health metadata: `C:\Users\colem\.openclaw\openclaw.json`

## Docker Program Files Findings

No OpenClaw config was found directly in Docker Desktop Program Files.

Docker Desktop files checked included:

- `C:\Program Files\Docker\Docker\app.json`
- `C:\Program Files\Docker\Docker\resources\config-options.json`
- `C:\Program Files\Docker\Docker\resources\linux-daemon-options.json`
- `C:\Program Files\Docker\Docker\resources\windows-daemon-options.json`
- `C:\Program Files\Docker\Docker\*.config`
- `C:\Program Files\Docker\cli-plugins\*`

Result: these are Docker Desktop install/config/plugin files. They do not contain OpenClaw references.

## Docker Object Findings

Relevant Docker objects exist:

- Container: `RangerHQ`
- Image: `openclaw:latest`
- Container status: exited
- Container exit code: `78`
- Gateway command: `npx openclaw gateway --port 18789`
- Exposed port: `18789/tcp`
- Working directory: `/app`
- Runtime user: `nodejs`
- Network mode: `bridge`
- Mounts: none
- Read-only root filesystem: `false`
- Cap drop: none
- PID limit: none
- Memory limit: none
- CPU limit: none

Container logs show:

```text
Missing config. Run `openclaw setup` or set gateway.mode=local (or pass --allow-unconfigured).
```

This indicates the stopped `RangerHQ` container failed before serving the gateway.

## OpenClaw Image Config Findings

The `openclaw:latest` image contains OpenClaw config files under `/app`:

- `/app/openclaw.json`
- `/app/logs/config-health.json`
- `/app/plugins/installs.json`
- `/app/workspace/.openclaw/workspace-state.json`
- `/app/sandboxes/agent-main-f331f052/.openclaw/workspace-state.json`
- `/app/agents/main/agent/auth-profiles.json`
- `/app/agents/main/agent/auth-state.json`

Auth state files were not printed. Secret-bearing fields were redacted during inspection.

## Host Config Verification

OpenClaw health metadata points to:

`C:\Users\colem\.openclaw\openclaw.json`

That host file exists.

- Size: `4169` bytes
- Last modified: `2026-05-13 13:42:15`
- SHA256: `723EF810AD8E0F26C45C4C248956A556264C8802F79243DFB3D8FE9A06EA29FC`

The SHA256 matches the OpenClaw `config-health.json` last-known-good hash:

`723ef810ad8e0f26c45c4c248956a556264c8802f79243dfb3d8fe9a06ea29fc`

## Non-Secret Config Summary

Host OpenClaw config summary:

```json
{
  "gatewayMode": "local",
  "gatewayPort": 18789,
  "gatewayBind": "loopback",
  "tailscaleMode": "off",
  "agentSandboxMode": "all",
  "agentSandboxBackend": "docker",
  "workspaceAccess": "none",
  "dockerNetwork": "none",
  "readOnlyRoot": true,
  "capDrop": "ALL",
  "pidsLimit": 256,
  "memory": "1g",
  "cpus": 1,
  "primaryModel": "anthropic/claude-opus-4-7",
  "workspace": "C:\\Users\\colem\\.openclaw\\workspace",
  "enabledPlugins": ["anthropic", "duckduckgo"]
}
```

## Assessment

The actual host OpenClaw config already matches Ranger HQ's safest intended defaults:

- local gateway mode
- loopback bind
- Tailscale off
- Docker sandbox backend
- no workspace access by default
- Docker network disabled for agents
- read-only root filesystem for agent sandboxes
- all Linux capabilities dropped
- PID, memory, and CPU limits set

The existing `RangerHQ` Docker container does not itself enforce those safety constraints at the container level. It was created with bridge networking, writable root filesystem, no cap drop, no PID limit, no memory limit, and no CPU limit. Treat that container as unsuitable for live Ranger HQ use until recreated with locked-down runtime flags or replaced by a controlled launcher.

## Required Follow-Up

- Do not overwrite `C:\Users\colem\.openclaw\openclaw.json`.
- Do not start or reuse the existing `RangerHQ` container for live workflows.
- Add a Ranger HQ controlled OpenClaw launcher that mounts/points to the verified host config and applies runtime restrictions.
- Preserve approval gates before any OpenClaw integration can activate agents or external tools.

