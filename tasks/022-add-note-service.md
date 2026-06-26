# Task 022 - Add Frontend Note Service

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add a typed frontend service for backend job note APIs.

## Scope

In scope:

- Add note API calls through the existing frontend API wrapper.
- Define typed note request/response models as needed.

Out of scope:

- Replacing the job detail notes tab.
- Saving AI answers as notes.

## Required Changes

- Add service functions for list, create, update, and delete note
  behavior.
- Reuse shared API error handling.
- Add service tests.

## Tests

- Successful note API calls.
- API error normalization.
- Request body shape for note create/update.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Note service functions are typed.
- [ ] Tests cover success and error paths.
- [ ] No UI behavior changes yet.

## Commit

```text
task-022: add frontend note service
```
