# RangerHQ Agent and Room Contract

## Core Principle

Visible agents mirror real backend workflows. Unity displays what the backend says is happening; it does not invent jobs, task names, or work phases.

## Starter Base Rooms

The first playable base map should focus on:

- Command Center
- Research Lab
- Forge / Factory Floor
- Etsy Room
- Fiverr Room
- Publish Bay
- Mess Hall / Break Room
- Future Room
- Locked / unused expansion slots

Additional project rooms from the larger prototype, such as Life Admin, School / Nursing, Archive / Logs, Gunpowder & Pearls, and Agent Staging Bay, can remain in the data model as expansion modules. They should not crowd the first Unity view unless explicitly promoted.

## Agent Update

```ts
AgentUpdate {
  type: "agent_update"
  agentId: string
  displayName: string
  role: "commander" | "research" | "builder" | "etsy" | "fiverr" | "publish" | "qa" | "admin" | "archive" | "future"
  roomId: string
  anchorId: string
  state: "working" | "moving" | "idle" | "on_break"
  currentTaskId: string
  currentTaskLabel: string
  currentPhase: string
  lastEventAt: string
}
```

`state` drives animation and status color. `currentTaskLabel` and `currentPhase` drive human-readable HUD text.

## Room Update

```ts
RoomUpdate {
  type: "room_update"
  roomId: string
  activeAgents: number
  idleAgents: number
  tasksInProgress: number
  tasksQueued: number
  headlineTask: string
  nextTask: string
}
```

## Unity Responsibilities

- Ensure one visible avatar exists for Ranger.
- Place each agent at the backend-provided room and anchor.
- Interpolate movement when room or anchor changes.
- Color the status icon from `state`.
- Show `currentTaskLabel` in agent hover/nameplate tooltip.
- Summarize live room work from room and agent updates.

## Explicit Non-Goals

- Do not hard-code user-visible task names in Unity.
- Do not invent roles or rooms.
- Do not show generic `Working...` if `currentTaskLabel` is available.
- Do not simulate fake business work. Only small animations are local.
