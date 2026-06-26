# Task 032 - Connect Timeline Tab To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Render job timeline events from backend data.

## Scope

In scope:

- Load timeline events for the current job.
- Render backend event timestamps and descriptions.
- Show loading, empty, and error states.

Out of scope:

- Timeline event mutation UI.
- Backend status event creation.

## Required Changes

- Add timeline service behavior if not already covered by the job detail
  service.
- Replace local timeline data source in the tab.
- Add tests for timeline states.

## Tests

- Timeline renders backend events.
- Empty timeline state renders.
- API error state renders.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Timeline tab uses backend data.
- [ ] Empty and error states are accessible.
- [ ] Tests cover visible states.

## Commit

```text
task-032: connect timeline tab to backend
```
