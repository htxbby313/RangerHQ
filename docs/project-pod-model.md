# Project Pod Model

Every project is a module. Each project can have:

- one or more rooms
- one or more agents
- one or more workflows
- its own files
- its own permissions
- its own logs
- its own approval rules
- its own status

## Multi-Agent Pods

Project pods may include:

- Lead Agent
- Research Agent
- Builder Agent
- Reviewer / QA Agent
- Dispatch Agent

Hard rule: no agent may approve its own work.

The MVP stores project-agent links and keeps role labels explicit so reviewer separation can be enforced before live execution is added.

