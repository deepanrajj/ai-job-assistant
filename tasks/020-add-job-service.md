# Task 020 - Add Frontend Job Service

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add a typed frontend service for backend job APIs.

## Scope

In scope:

- Add job API calls through the existing frontend API wrapper.
- Define typed request/response models as needed.
- Keep localStorage provider behavior unchanged until integration tasks
  replace it.

Out of scope:

- Replacing pages with backend data.
- Adding a new data-fetching library.

## Required Changes

- Add job service functions for list, detail, create, update, and
  delete.
- Reuse existing `AppError` and API client patterns.
- Add service tests with mocked fetch behavior.

## Tests

- Successful API responses.
- API error normalization.
- Request body shape for create/update.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Job service functions are typed.
- [ ] Tests cover success and error paths.
- [ ] No UI behavior changes yet.

## Commit

```text
task-020: add frontend job service
```
