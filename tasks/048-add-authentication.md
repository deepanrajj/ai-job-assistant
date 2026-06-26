# Task 048 - Add Authentication

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Add user authentication to Smart Job Tracker.

## Scope

In scope:

- Choose and document the authentication approach before implementation.
- Protect backend APIs that read or mutate user-owned tracker data.
- Add frontend login/logout/session handling.

Out of scope:

- Team accounts or organization management.
- Public sharing.
- Billing.

## Required Changes

- Add authentication configuration without committing secrets.
- Add backend security tests for protected and public routes.
- Add frontend tests for authenticated/unauthenticated states.

## Tests

- Unauthenticated protected API calls are rejected.
- Authenticated API calls are allowed.
- Frontend shows the correct session controls.

## Validation

Run `npm run verify`.

## Acceptance Criteria

- [ ] Authenticated users can access tracker features.
- [ ] Unauthenticated users cannot access protected data.
- [ ] Secrets are documented but not committed.

## Commit

```text
task-048: add authentication
```
