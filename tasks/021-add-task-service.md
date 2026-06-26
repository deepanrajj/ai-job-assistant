# Task 021 - Add Frontend Task Service

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add a typed frontend service for backend job task APIs.

## Scope

In scope:

- Add task API calls through the existing frontend API wrapper.
- Define typed task request/response models as needed.

Out of scope:

- Replacing the job detail tasks tab.
- Adding a new state library.

## Required Changes

- Add service functions for list, create, update, and delete task
  behavior.
- Reuse shared API error handling.
- Add service tests.

## Tests

- Successful task API calls.
- API error normalization.
- Request body shape for task create/update.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Task service functions are typed.
- [ ] Tests cover success and error paths.
- [ ] No UI behavior changes yet.

## Commit

```text
task-021: add frontend task service
```
