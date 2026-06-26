# Task 019 - Track Timeline Events When Job Status Changes

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Record timeline events when a job status changes.

## Scope

In scope:

- Add timeline event creation to job status update behavior.
- Add read support needed to display a job timeline from backend data.
- Preserve append-only event history.

Out of scope:

- Frontend integration.
- Editing or deleting timeline events.
- Events for every job field change unless explicitly needed.

## Required Changes

- Update job service behavior to detect status changes.
- Persist a timeline event with clear user-facing text.
- Add tests for status-change and no-change cases.

## Tests

- Status change creates one timeline event.
- Updating a job without status change does not create a status event.
- Missing job behavior still returns the expected error.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Status changes create timeline events.
- [ ] Timeline reads return persisted events.
- [ ] Backend verification passes.

## Commit

```text
task-019: track timeline events when job status changes
```
