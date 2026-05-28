# Kill Switch

The kill switch is the highest-priority safety control.

When active:

- stop active jobs
- disable write tools
- disable external actions
- pause workflows
- mark system `SAFE_MODE`
- show a visible warning in the UI
- log an event

## Current MVP Behavior

The local backend stores kill switch state in local JSON. When active, new workflow requests are blocked and an event is emitted. Future containerized workers must subscribe to kill switch state through Redis and shut down immediately.

