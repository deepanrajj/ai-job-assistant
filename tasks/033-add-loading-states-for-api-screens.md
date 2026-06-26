# Task 033 - Add Loading States For API Screens

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Standardize loading states across API-backed screens.

## Scope

In scope:

- Use existing shared loading components where appropriate.
- Apply loading states to API-backed dashboard, jobs list, job detail,
  forms, tasks, notes, and timeline screens.

Out of scope:

- New skeleton design system.
- Backend changes.

## Required Changes

- Reuse `LoadingState` or existing skeletons.
- Ensure loading content has accessible status semantics where needed.
- Add or update tests for loading states.

## Tests

- Each affected API screen exposes a clear loading state.
- Loading state does not hide accessible page structure unnecessarily.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] API screens have consistent loading states.
- [ ] Loading states are accessible.
- [ ] Tests cover loading behavior.

## Commit

```text
task-033: add loading states for api screens
```
