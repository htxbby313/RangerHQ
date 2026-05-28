# Ranger HQ Architecture

Ranger HQ is local-first. The frontend displays the command center; the backend owns state, events, permissions, approvals, rooms, agents, projects, logs, and kill switch behavior.

## Layers

- OpenClaw: existing command-agent environment. Current config must be inspected and protected before live integration.
- Docker sandbox layer: future agent rooms run in locked-down containers.
- Local API: command surface for rooms, projects, agents, approvals, events, and workflows.
- PostgreSQL: durable target database.
- Redis: future event bus, job queue, room status updates, and approval notifications.
- Web HQ frontend: local visual shell for controls, status, and review.

## Current Implementation

The first build is dependency-light and stores local JSON state. It mirrors the PostgreSQL schema and keeps the surface intentionally small. This lets the doctrine harden before Redis, container orchestration, and live agent activation are added.

## OpenClaw Config Inspection

OpenClaw config has been inspected. See `docs/openclaw-config-audit.md`.

The verified host config is:

`C:\Users\colem\.openclaw\openclaw.json`

Do not overwrite this file. The existing Docker container named `RangerHQ` exited with code `78` and should not be reused for live workflows because its container runtime settings are looser than Ranger HQ's required sandbox posture.
