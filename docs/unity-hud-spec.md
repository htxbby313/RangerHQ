# RangerHQ Unity HUD Spec

## Goal

Implement a lightweight HUD over the BaseHQ scene:

- Room HUD: localized panel shown on room hover/focus.
- Global HUD: thin top status bar.
- Agent HUD: tiny nameplates/status indicators above agents.

The world remains the primary interface. HUD should explain the room, not replace it.

## Implemented Scaffold

Unity scripts live in `C:\Users\colem\My project\Assets\RangerHQ\Scripts`:

- `RoomStats`
- `RoomHoverUI`
- `RoomHudController`
- `GlobalHudController`
- `AgentStatus`
- `AgentNameplateController`

The scene builder creates:

- `MainHUDCanvas`
- `TopBar`
- `RoomHudPanel`
- room hover colliders
- mock `RoomStats` for each room
- `AgentStatus` on generated agent markers

## Visual Rules

- Top bar height target: 36-48 px.
- Room HUD target width: 220-260 px.
- Room HUD should show only 2-3 KPI lines.
- Agent labels should stay small and never hide the room art.
- HUD colors should use room frame accents on light Antheus-style surfaces.
- Room HUD background: `#FFFFFF` at about 94% opacity.
- Room HUD title: `#27162D`.
- Room HUD KPI text: `#7A6A88`.
- Global top bar background: `#FFF3FA`.
- Global top bar border: `#E7E0F0`.
- Working status dot: `#4AD88A`.
- Moving status dot: `#36C4FF`.
- Idle status dot: `#FFC44D`.
- On break status dot: `#FF8A4A`.

## Data Flow

Current data is local/mock. Later backend updates should feed:

- `RoomDefinition.stats`
- `GlobalHudController.totalAgents`
- `GlobalHudController.activeAgents`
- `AgentStatus.activityState`
- `AgentStatus.currentTaskId`
- `AgentStatus.currentTaskLabel`
- `AgentStatus.currentPhase`
- `AgentStatus.anchorId`

This keeps the HUD swappable without rewriting room art or movement systems.

## Live Workflow Rule

Unity does not own the job system. It only displays backend/OpenClaw workflow state.

High-level agent states map to animation and color:

- `Working`: agent has an active `currentTaskId`.
- `Moving`: backend has assigned a new room/anchor and Unity is interpolating there.
- `Idle`: agent is connected and waiting between tasks.
- `OnBreak`: backend has sent the agent to Mess Hall.

Visible task text must come from `currentTaskLabel`, never from a Unity hard-coded task list.

Example backend update:

```json
{
  "type": "agent_update",
  "agentId": "fiverr-1",
  "displayName": "Fiverr",
  "role": "fiverr",
  "roomId": "fiverr-services-room",
  "anchorId": "desk_2",
  "state": "working",
  "currentTaskId": "task-984",
  "currentTaskLabel": "Draft 5 Fiverr gig descriptions",
  "currentPhase": "writing",
  "lastEventAt": "2026-05-26T21:20:00Z"
}
```

Room HUD lines should aggregate the live labels of agents in that room. Agent hover/nameplate tooltip should show `currentTaskLabel`.
