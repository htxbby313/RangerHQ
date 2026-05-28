# RangerHQ Visual Reference Lock

The current reference direction is a bright 2D management-game factory/base deck.

## What To Keep

- Modular rooms in a connected grid.
- Darker corridors used as contrast between rooms.
- Large glass-front room windows.
- Bright neon room frames by department.
- Strong interior lighting.
- Dense furniture and workstation rows.
- Visible doors and thresholds centered on room edges.
- Small workers inside rooms and moving through halls.
- Lightweight floating prompts/labels near rooms.

## What To Avoid

- Overall bleak/dark dashboard mood.
- Rooms that read as empty boxes.
- UI panels replacing the rooms.
- Cyberpunk darkness where the room contents are hard to read.
- Flat card grids without physical doors/corridors.

## Brightness Rule

The environment can have a dark shell, but the rooms themselves must be bright enough to inspect.

Use this balance:

- corridors: dark charcoal/purple
- room floors: warm gray or warm brown industrial tile
- room interiors: lit by white panels, warm lamps, cyan screens, orange task lights
- frames: saturated department colors
- props: dense, readable, color-coded

## Base View Composition

Base view should look like stacked connected rooms with visible interiors:

- room shell with thick colored frame
- semi-transparent glass/window layer
- top/bottom centered doors
- interior wall lights
- grid/tile floor
- 2-3 rows of workstations
- storage props along walls
- small agents at stations
- hallway bridges between room doors

## Zoom View Composition

Zoom view should feel like the camera pushes into the same room, not a separate card:

- larger furniture
- stronger perspective/depth
- readable workstations
- named workers
- project state attached to the room
- mood lighting specific to the room purpose

## Palette

Use the Antheus light colorway: white/cream surfaces, soft shadows, and pastel pink/purple/orange accents. The HQ should not read as a black cyberpunk deck.

Base surfaces:

- main background: `#FFF8FD`
- panel background: `#FFFFFF`
- soft secondary panel: `#F7F0FF`
- divider/border: `#E7E0F0`
- primary text: `#27162D`
- secondary text: `#7A6A88`
- muted labels: `#B2A4C5`

Brand gradients:

- pink/orange: `#FF5DB8` to `#FFA14D`
- pink/purple: `#F35DB4` to `#8D67FF`

Room accents:

- Command: `#FF8A4A`, fill `#FFE0C4`
- Research: `#F35DB4`, fill `#FFE0F2`
- Forge: `#8D67FF`, fill `#E6DAFF`
- Etsy: `#FFC44D`, fill `#FFF2C9`
- Fiverr: `#36C4FF`, fill `#D8F4FF`
- Publish: `#4AD88A`, fill `#D9F7E6`
- Mess Hall: `#FF88D4`, fill `#FFE3F4`
- Future: `#B07CFF`, fill `#EDE1FF`
- Locked/unused: `#C7C0D5`, fill `#F3EFF9`

Room interiors can retain darker depth:

- floor base: `#1B1624`
- mid wall: `#241C33`
- pink light: `#F091CF`
- orange light: `#FFB56F`
- purple light: `#B094FF`

## Key Interpretation

The references are not asking for a darker sci-fi UI. They are asking for a readable factory dollhouse/base: dark structure, bright rooms, dense props, glowing labels, and obvious doors.

## Video Reference Additions

The reviewed video reinforces the same rule: dark shell, bright rooms. It also adds:

- selected/focused room outline should be bright white or warm white
- top HUD should stay thin and edge-aligned
- room hover/focus info should appear locally near the room
- corridors should use colored route lines without becoming the main visual focus
- camera should smoothly move from overview to room focus instead of swapping to dashboard panels

## Implementation Update

Unity/Web rooms should now be built with:

- dark outer structural frame
- bright lit room interior
- semi-transparent glass front
- warm industrial floor grid
- two visible ceiling light panels
- small glowing screen strips
- 2 rows of furniture/workstations
- saturated neon room frame
- large center doors with glowing threshold

If the base view is zoomed out, the room should still show:

- where the door is
- where the agents can stand
- what kind of work happens there
- which project owns the room
