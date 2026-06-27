# Task 052 - Add User Specific Jobs

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Scope jobs and related tracker data to the authenticated user.

## Scope

In scope:

- Persist user ownership on jobs and child records.
- Filter reads and writes by authenticated user.
- Prevent cross-user access.

Out of scope:

- Shared jobs/team collaboration.
- Billing entitlements.
- Admin views.

## Required Changes

- Add user ownership to backend models and queries.
- Update frontend assumptions from local-only data to user-owned data.
- Add access tests.

## Tests

- User sees only their jobs.
- User cannot read/update/delete another user's job.
- Child records follow job ownership.

## Validation

Run `npm run verify`.

## Acceptance Criteria

- [ ] Tracker data is user-scoped.
- [ ] Cross-user access is rejected.
- [ ] Tests cover ownership boundaries.

## Commit

```text
task-052: add user specific jobs
```
