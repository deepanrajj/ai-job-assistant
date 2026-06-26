# Task 023 - Add Typed API Response Models

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Align frontend API types with backend job tracker response contracts.

## Scope

In scope:

- Add or refine frontend types for backend job, task, note, and timeline
  responses.
- Add mapper utilities only when backend wire models differ from UI
  models.

Out of scope:

- Backend endpoint changes.
- Replacing UI data sources.

## Required Changes

- Keep wire types and UI/domain types clear.
- Add tests for mapping utilities if introduced.
- Avoid duplicating types that already match existing domain models.

## Tests

- Mapper tests for date/status/nullable field conversion if needed.
- Type-level behavior should be covered through service tests where
  practical.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] API response models are typed.
- [ ] UI models remain stable.
- [ ] Mapping behavior is tested when non-trivial.

## Commit

```text
task-023: add typed api response models
```
