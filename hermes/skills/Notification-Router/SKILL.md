# Notification-Router

Purpose: Convert urgent Hermes events into structured OpenClaw notification payloads.

Inputs: room, urgency, title, message, requiresApproval, channel, metadata.

Outputs: OpenClaw payload with source, room, urgency, title, message, requiresApproval, timestamp, and metadata.

Safety: Basic alerts may route automatically. Anything that sends final copy, publishes, spends, trades, or changes external state requires explicit approval first.
