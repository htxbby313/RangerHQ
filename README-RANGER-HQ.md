# Ranger HQ

Ranger HQ is a local-first personal AI command center for Antheus/Tay. It is not a SaaS product. It is a private operating system for managing rooms, projects, agents, approvals, logs, and future sandboxed workflows.

Core concept:

> The Sims meets mission control, backed by sandboxed agent infrastructure.

## Doctrine

Ranger HQ must be boring-safe before it is impressive.

No autonomous:

- publishing
- spending
- messaging
- account changes
- school submissions
- external writes
- agent activation
- tool permission changes

All consequential actions follow:

Draft -> Stage -> Review -> Approve / Reject / Iterate -> Execute

Only Tay can move an agent from `STAGING` to `ACTIVE`.

## Build Order

1. Inspect and protect current OpenClaw config.
2. Lock down Docker sandboxing.
3. Build local backend API.
4. Build database schema.
5. Build room/project/agent model.
6. Build approvals.
7. Build KILLSWITCH.
8. Build visual HQ shell.
9. Build Agent Staging Bay.
10. Add Ranger's agent-generation workflow later.

## Current MVP

This repository starts with a dependency-light local MVP:

- `backend/server.js`: local API, event log, approvals, kill switch, staged agents, rooms, projects, and draft-only workflow.
- `backend/openclaw.js`: controlled OpenClaw gateway status, launch, and stop integration.
- `frontend/index.html`: visual HQ shell with HUD, rooms, projects, agents, approvals, events, and kill switch controls.
- `database/schema.sql`: PostgreSQL target schema.
- `docker-sandbox-config.example.json`: safest default sandbox policy.
- `docs/`: architecture and doctrine references.

## Run Locally

Use the bundled or system Node runtime:

```powershell
node backend/server.js
```

Then open:

```text
http://localhost:4147
```

The backend stores local state in `backend/data/ranger-hq.local.json`. This file is intentionally local-only and should not be treated as production config.

## API Surface

GET:

- `/summary`
- `/rooms`
- `/rooms/:id`
- `/projects`
- `/projects/:id`
- `/events`
- `/agents`
- `/approvals`

POST:

- `/rooms`
- `/projects`
- `/agents/stage`
- `/kill-switch`
- `/workflow/research-idea`
- `/openclaw/launch`
- `/openclaw/stop`

OpenClaw:

- `/openclaw/status`

PATCH:

- `/rooms/:id`
- `/projects/:id`
- `/approvals/:id`

## First Working Workflow

The initial workflow is draft-only:

Research idea -> Draft concept -> QA review -> Queue approval -> Tay approves/rejects/iterates -> Save output locally

The MVP starts with the Shuqualak Store and Creative Studio rooms. It never executes external actions.
