# Approval Flow

All consequential actions follow:

Draft -> Stage -> Review -> Approve / Reject / Iterate -> Execute

## Consequential Actions

Ranger HQ blocks autonomous:

- publishing
- spending
- messaging
- account changes
- school submissions
- external writes
- agent activation
- tool permission changes

## Rules

- No agent may approve its own work.
- Only Tay can activate staged agents.
- Draft-only workflows may create local proposals and approval records.
- External execution must stay blocked while an approval is pending.
- Approval records must emit events for request, approval, rejection, and iteration.

## Approval Statuses

- `PENDING`
- `APPROVED`
- `REJECTED`
- `ITERATE`

