# Task 015 - Create Note Service

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add backend business logic for job note operations.

## Scope

In scope:

- Create, update, delete, and list notes for a job.
- Convert missing job/note cases into typed API errors.

Out of scope:

- HTTP routes.
- AI answer-to-note behavior.
- Authentication ownership.

## Required Changes

- Add a note service.
- Keep note behavior scoped to a parent job.
- Add service tests.

## Tests

- Create note for a job.
- Update note body.
- Delete note.
- Missing job/note errors.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Note service owns note business logic.
- [ ] Parent job boundaries are respected.
- [ ] Service tests cover behavior.

## Commit

```text
task-015: create note service
```
