# News-Alert-Filter

Purpose: Decide which news items are urgent enough to notify the user.

Inputs: news item, severity, impact, freshness, confidence, duplicate history.

Outputs: alert decision, urgency, notification payload draft.

Safety: High-priority alerts must be concise and source-aware. Do not over-alert on low-confidence items.
