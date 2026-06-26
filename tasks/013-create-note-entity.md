# Task 013 - Create Note Entity

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Create the backend persistence model for job notes.

## Scope

In scope:

- Add a Flyway migration for job notes.
- Add a Kotlin entity linked to jobs.

Out of scope:

- Note repositories, services, controllers, or endpoints.
- AI answer-to-note behavior.

## Required Changes

- Map note body, timestamps, and job relation.
- Preserve delete behavior intentionally.

## Tests

- Add migration/entity coverage if persistence tests exist.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Note schema exists.
- [ ] Note entity maps to a job.
- [ ] No note API is introduced yet.

## Commit

```text
task-013: create note entity
```
