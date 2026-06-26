# Task 034 - Add Error States For API Screens

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Standardize error states across API-backed screens.

## Scope

In scope:

- Use existing shared error components where appropriate.
- Apply error states to API-backed dashboard, jobs list, job detail,
  forms, tasks, notes, and timeline screens.
- Preserve useful retry or navigation actions when available.

Out of scope:

- Toast system replacement.
- Backend error contract changes.

## Required Changes

- Reuse `ErrorState` or existing alerts.
- Ensure errors are announced or reachable by assistive technology.
- Add or update tests for error states.

## Tests

- Each affected API screen exposes a clear error state.
- Error messages come from normalized `AppError` behavior.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] API screens have consistent error states.
- [ ] Error states are accessible.
- [ ] Tests cover error behavior.

## Commit

```text
task-034: add error states for api screens
```
