# Task 025 - Replace Mock Jobs On Dashboard Page

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Load dashboard metrics and recent activity from backend job data.

## Scope

In scope:

- Fetch jobs for dashboard calculations.
- Preserve existing dashboard metric and status overview behavior.
- Show loading and error UI patterns.

Out of scope:

- Jobs list integration.
- New analytics endpoints.
- Backend changes.

## Required Changes

- Replace dashboard mock/local data source with job service data.
- Keep dashboard utility functions reusable.
- Add tests for loading, success, and error states.

## Tests

- Metrics are calculated from API jobs.
- Recent activity renders API jobs.
- Loading and error states render accessibly.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Dashboard uses backend job data.
- [ ] Existing calculations are preserved.
- [ ] Tests cover user-visible states.

## Commit

```text
task-025: replace mock jobs on dashboard page
```
