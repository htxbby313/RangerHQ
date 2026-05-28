# RangerHQ Pre-Unity Handoff

This browser build is the visual prototype and product contract for the Unity phase. It is not intended to become the final engine.

## Current Prototype Scope

The local UI at `http://localhost:4147` now demonstrates:

- an expanded connected BaseHQ map with all required pre-Unity rooms represented or prepared
- visible corridors, hallways, room doors, and permitted hallway traffic
- compact room interiors with small props, furniture, lighting, and worker sprites moving inside their assigned rooms
- hover inspection near the selected room
- click-to-zoom room view with larger agents, deeper perspective, richer furniture, and stronger lighting
- OpenClaw, Docker, approvals, kill switch, and recent events as a light HUD
- structured live project-module data for real RangerHQ projects, not only fake room labels

## Visual Split

Base view should read as a 2D operational factory map.

- Small furniture and small agents are visible.
- Rooms are connected by corridors and doors.
- Normal agents primarily work inside rooms.
- Agents may use hallways for job-required transfers, downtime wandering, or moving to another department such as Research, Forge, or Publish.
- Security detail agents also patrol hallways and shared infrastructure as a dedicated safety function for the whole system.
- Status is communicated through room frame color, lighting, and activity.
- The goal is operational awareness, not full room immersion.

Zoom view should read closer to a rich 2.5D or isometric room scene.

- Furniture becomes larger and more detailed.
- Agents are readable as workers with names/ranks.
- Lighting, shadows, monitor glow, and department color create mood.
- The room should feel like a playable environment, not a UI card.

## Agent Rank Doctrine

There is only one Ranger.

- Ranger is the HQ Command Sergeant and belongs to Ranger Command.
- Nova, Forge, Chronicle, Dispatch, Scrubs, and Admin are Master Sergeants of their assigned rooms.
- QA roles are Staff Sergeants.
- Everyone else in a room is a Specialist assigned to that room's job.

## Unity Requirements

The Unity phase should implement the same structure with real scene systems:

- `BaseHQ` scene with orthographic camera
- modular tile/grid room placement
- connected corridors, doors, and hallway paths
- hallway pathing for work transfers, downtime wandering, and security patrols
- room status lighting and frame color
- small base-view sprites for workers, props, stations, and activity
- smooth camera transition into room zoom
- detailed zoomed room compositions with layered props and workstations
- data-driven room definitions matching the browser prototype keys
- project modules with status, assigned rooms, assigned agents, workflows, linked paths, integrations, approvals, events, and notes

## Stable Room Keys

The current prototype uses these stable room identifiers:

- `command`
- `research`
- `forge`
- `etsy`
- `gunpowder-pearls`
- `fiverr`
- `publish`
- `life-admin`
- `school-nursing`
- `mess-hall`
- `future`
- `staging`
- `archive`

The backend slugs remain separate and map to current RangerHQ rooms:

- `command-room`
- `research-war-room`
- `creative-studio`
- `shuqualak-store-room`
- `gunpowder-pearls-room`
- `fiverr-services-room`
- `publish-dispatch-room`
- `life-admin-room`
- `school-nursing-room`
- `mess-hall-break-room`
- `future-projects-room`
- `agent-staging-bay`
- `archive-logs-room`

## Project Data Contract

Project modules should use this shape:

```ts
Project {
  id
  name
  type
  status
  assignedRoomIds
  assignedAgentIds
  workflows
  linkedLocalPaths
  integrations
  approvals
  events
  notes
}
```

## Room Data Contract

Room modules should use this shape:

```ts
Room {
  id
  name
  type
  status
  connectedRoomIds
  doorPositions
  hallwayConnections
  furniture
  agents
  projectIds
  colorTheme
  zoomConfig
}
```

## Agent Data Contract

Agents should use this shape:

```ts
Agent {
  id
  name
  role
  status
  state
  currentRoomId
  anchorId
  assignedProjectIds
  currentTask
  currentTaskId
  currentTaskLabel
  currentPhase
  movementState
  lastEventAt
}
```

`state` and `movementState` are animation buckets only. User-visible work descriptions must come from `currentTaskLabel` and `currentPhase`, which are produced by the backend/OpenClaw workflow layer.

## Live Binding Rules

Clicking a room should reveal the project state assigned to that room:

- Shuqualak Store Room opens Shuqualak Store state.
- Gunpowder & Pearls Room opens Gunpowder & Pearls state.
- Fiverr / Services Room opens service workflow state.
- School / Nursing Room opens study/task state.
- Life Admin Room opens personal admin state.

External actions remain blocked until explicitly approved. The proof of concept may use local mocked events, local project data, local file paths, and local approval queues.

## Live Agent Work Rule

Agents are not dummy workers with canned jobs. Each visible agent is a front-end representation of a real backend workflow.

Unity may decide how to animate an agent, but it must not invent what the agent is doing. Task names, phases, artifacts, URLs, files, and approval states come from backend updates such as:

```json
{
  "type": "agent_update",
  "agentId": "forge",
  "displayName": "Forge",
  "role": "builder",
  "roomId": "creative-studio",
  "anchorId": "forge_console_1",
  "state": "working",
  "currentTaskId": "task-123",
  "currentTaskLabel": "Draft 3 Etsy listing descriptions",
  "currentPhase": "writing_copy",
  "lastEventAt": "2026-05-26T21:20:00Z"
}
```

Unity should show that update through agent position, status icon color, tooltip text, and room HUD summaries.

## Unity Scene Model

The browser proof of concept should translate to Unity as:

- rooms as prefabs
- doors as coordinates
- furniture as modular child objects
- agents with spawn, idle, work, and hallway path points
- hallways as movement graphs
- room zoom as camera target points
- statuses as lighting/effect states
- projects bound to rooms through data

Seeded project modules:

- Shuqualak Store
- Gunpowder & Pearls
- Fiverr / Services
- School / Nursing
- Life Admin
- Future Projects

## Rule

The world is the interface. HUD elements support the HQ; they do not replace it.

Visual brightness rule: RangerHQ may use a dark outer shell and corridors, but rooms must be bright enough to inspect. The target is a connected, glass-front 2D factory/base deck with saturated room frames, visible doors, dense props, and lit workstations.
