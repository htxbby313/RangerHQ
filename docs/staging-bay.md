# Agent Staging Bay

The Agent Staging Bay is quarantine for generated or proposed agents.

Staged agents:

- cannot run live workflows
- cannot access external tools
- cannot publish
- cannot message
- cannot spend
- cannot modify production config
- cannot spawn other agents

Only Tay can move:

`STAGING` -> `ACTIVE`

## Current MVP

`POST /agents/stage` creates a staged agent spec and queues an approval request. There is no activation endpoint in the MVP.

