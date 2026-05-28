# Room and Agent Model

Docker containers are treated as future agent rooms.

Each agent eventually has:

- one room
- one scope
- one workspace
- one tool policy
- one approval path

## Core Rooms

- Command Room
- Shuqualak Store Room
- Gunpowder & Pearls Room
- Creative Studio
- School / Nursing Room
- Life Admin Room
- Research / War Room
- Agent Staging Bay
- Archive / Logs Room

## Room Statuses

- `ACTIVE`
- `PAUSED`
- `ARCHIVED`
- `SHUT_DOWN`
- `STAGING`

## Initial Agents

- Ranger
- Nova
- Forge
- Chronicle
- Dispatch
- Scrubs
- Admin
- QA

## Ranger Authority

Ranger may draft:

- agent specs
- room configs
- workflow configs
- tool policies
- prompt templates
- JSON schemas
- container configs

Ranger may not:

- activate generated agents automatically
- grant permissions automatically
- connect external APIs automatically
- publish, send, buy, or delete
- bypass staging review

