# Task 010 - Create Task Service

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add backend business logic for job task operations.

## Scope

In scope:

- Create, update, delete, and list tasks for a job.
- Convert missing job/task cases into typed API errors.

Out of scope:

- HTTP routes.
- Notes and timeline events.
- Authentication ownership.

## Required Changes

- Add a task service in the task/jobs domain area.
- Keep task behavior scoped to a parent job.
- Add service tests.

## Tests

- Create task for a job.
- Update task status/title/due date.
- Delete task.
- Missing job/task errors.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Task service owns task business logic.
- [ ] Parent job boundaries are respected.
- [ ] Service tests cover behavior.

## Commit

```text
task-010: create task service
```
