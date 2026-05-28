# HQ-State-Manager

Purpose: Own Ranger HQ room, project, agent, approval, pause, archive, and kill-switch state.

Inputs: room updates, agent updates, approval requests, kill-switch requests, resume requests.

Outputs: canonical HQ state JSON, state-change events, approval queue changes.

Safety: Hermes may suggest state changes. Only the user may approve major state changes, room archive/delete, workflow activation, or external action.
