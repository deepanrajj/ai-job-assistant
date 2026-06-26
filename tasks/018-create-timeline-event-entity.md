# Task 018 - Create Timeline Event Entity

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Create the backend persistence model for job timeline events.

## Scope

In scope:

- Add a Flyway migration for timeline events.
- Add a Kotlin entity linked to jobs.
- Store event type, description, and timestamp.

Out of scope:

- Automatic event creation.
- Frontend timeline integration.
- Event editing or deletion.

## Required Changes

- Add schema and entity for timeline events.
- Keep events append-only unless a later task says otherwise.

## Tests

- Add migration/entity coverage if persistence tests exist.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Timeline event schema exists.
- [ ] Timeline event entity maps to a job.
- [ ] No event mutation API is introduced.

## Commit

```text
task-018: create timeline event entity
```
