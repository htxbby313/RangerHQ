# RangerHQ Visual Architecture Doctrine

RangerHQ is a living AI operations colony management environment.

Rooms are physically connected. Agents visibly perform labor. Workflows are spatially represented. The HQ should feel alive, expandable, and operational.

The visual system combines:

- AndrooAGI-style connected colony/base navigation
- rich zoomed-in room environments with mood, lighting, furniture, depth, and composition

## Base View

The base view provides operational awareness.

It should read as a compact 2D sprite/factory map. Furniture, props, doors, and agents are visible at small scale, but detail is intentionally simplified. The richness appears when the operator zooms into a room.

The operator sees:

- full connected HQ
- modular rooms
- real hallways, doors, pathways, and future elevators/corridors
- moving agents
- visible operational activity
- glanceable room states

Hallways are active connective tissue, not restricted zones. Agents can move through them when their job requires another room, when they have downtime and are wandering, or when assigned to security detail. Security detail is a dedicated safety function for the whole system, separate from ordinary room work.

Camera style:

- top-down or slight-angle colony-management view
- smooth pan and zoom
- readable room state at a glance

Reference feel:

- Fallout Shelter
- RimWorld
- Oxygen Not Included
- Startup Company
- AndrooAGI AI colony/factory deck

The operator should immediately understand what rooms exist, what is active, where agents are working, where alerts exist, and how the HQ is expanding.

## Zoomed-In Room View

Zooming into a room should reveal a rich illustrated operational environment.

The zoomed view should read closer to 2.5D or isometric room art than the base map. Furniture and agents become larger, more dimensional, and easier to inspect.

The zoomed room should feel:

- immersive
- detailed
- atmospheric
- alive
- functional
- visually rewarding

The goal is not to copy exact reference rooms. The goal is to match composition quality, perspective, environmental density, lighting richness, and the feeling of inhabiting the room.

## Room Requirements

Every room needs strong lighting and mood:

- warm glows
- monitor lighting
- ambient room lighting
- department color lighting
- layered shadows
- atmospheric depth

Every room needs functionality-driven props:

- command terminals
- drafting desks
- mockup stations
- archive shelves
- production equipment
- planning boards
- print stations
- creative tools
- filing systems
- staging pods
- shipping tables
- server racks
- holographic displays

Props are interface language. They explain what work happens in the room.

Every room needs clear perspective and composition:

- visual depth
- focal point
- foreground and background layers
- readable navigation space
- interaction zones

Every room needs agent workspaces:

- standing positions
- workstation locations
- movement paths
- interaction points
- collaborative spaces

## Room Connection Philosophy

Rooms are not isolated menus. Rooms are physically connected modules in the HQ.

Hallways matter. Adjacency matters. Room growth matters. Expansion should feel rewarding.

## Environmental Storytelling

The HQ itself should communicate:

- operational maturity
- project growth
- workflow intensity
- agent activity
- system health
- room specialization

The environment is part of the interface.

## UI Philosophy

The world is the primary interface.

Avoid:

- giant dashboard panels
- spreadsheet-heavy layouts
- floating SaaS windows

Prioritize:

- contextual overlays
- embedded indicators
- hover inspection
- environmental status cues
- spatial interaction

## Color and Mood

Use:

- pink, purple, and orange-led palette
- warm industrial lighting
- controlled neon accents
- ambient monitor glow
- department-based accent colors
- brighter boutique creative-founder energy
- southern glam, western, retail, and operations details where room purpose calls for them

Avoid:

- bleak black UI
- crypto cyberpunk overload
- excessive neon clutter
- corporate SaaS visuals

The visual target is bright and personal: Barbie Dreamhouse meets AI operations command center with western, creative, and business energy. It should be polished, not childish.

Reference lock: use dark corridors only as contrast. The rooms themselves must be bright, readable, glass-front, dense with props, and lit like a management-game factory deck. If the furniture and workers cannot be read at a glance, the scene is too dark.

## Agent Simulation

Agents are visible live workers.

They should visibly:

- perform jobs
- move through rooms
- occupy stations
- react to task states
- communicate operational activity

The HQ should never feel static. Ambient movement is required.

## Unity Direction

Future Unity implementation should support:

- modular connected tile/grid system
- expandable HQ layout
- room placement and growth
- room state visualization
- detailed room environments
- richer props and furniture
- animated workstations
- agent activity loops
- atmospheric lighting
- smooth camera transition between base view and room zoom view

## Emotional Goal

The user should feel:

> I am overseeing and expanding a thriving AI operations colony.

Not:

> I am using enterprise productivity software.
