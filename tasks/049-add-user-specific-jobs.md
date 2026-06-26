# Task 049 - Add User Specific Jobs

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Ensure saved jobs belong to the authenticated user.

## Scope

In scope:

- Add user ownership to persisted jobs.
- Scope job, task, note, timeline, and AI output reads/writes by user.
- Update frontend behavior to show only the current user's jobs.

Out of scope:

- Shared jobs.
- Team accounts.
- Admin dashboards.

## Required Changes

- Add schema/model changes through Flyway if needed.
- Enforce user scoping at the backend service/repository boundary.
- Add tests that prevent cross-user access.

## Tests

- User can read and mutate their own jobs.
- User cannot read or mutate another user's jobs.
- Child resources respect the parent job owner.

## Validation

Run `npm run verify`.

## Acceptance Criteria

- [ ] Jobs are user-specific.
- [ ] Cross-user access is blocked.
- [ ] Tests cover ownership boundaries.

## Commit

```text
task-049: add user specific jobs
```
