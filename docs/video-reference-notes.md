# RangerHQ Video Reference Notes

Source reviewed: `C:\Users\colem\Videos\Recording 2026-05-26 213332.mp4`

Extracted review frames:

- `docs/reference-frames/frame_01_500ms.jpg`
- `docs/reference-frames/frame_02_30620ms.jpg`
- `docs/reference-frames/frame_03_61240ms.jpg`
- `docs/reference-frames/frame_04_91860ms.jpg`
- `docs/reference-frames/frame_05_122480ms.jpg`
- `docs/reference-frames/frame_06_152600ms.jpg`

## Locked Takeaways

- The base may use a dark command-map shell, but rooms must stay bright and readable.
- Rooms should read as glass-front compartments with lit interiors, dense furniture, and small workers.
- Corridors should be structural and dark, with thin colored route/status lines.
- Doors should be centered, obvious, and connected by short bridge thresholds.
- Selected/focused rooms should get a bright white outline in addition to their department color.
- HUD should stay thin and contextual: top status bar, localized hover panels, and small agent nameplates.
- Camera behavior should move from full base overview into room focus rather than opening a dashboard card.

## Unity Translation

- BaseHQ scene builder should generate bright room interiors, colored frames, center doors, hall routes, agent markers, and focus state.
- HUD scripts should be data-shaped so backend room, project, and agent state can replace mock data later.
- Zoomed-in room work should build from the same room modules, not from unrelated menu screens.
