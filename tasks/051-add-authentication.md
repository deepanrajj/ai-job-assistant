# Task 051 - Add Authentication

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Add authentication so tracker and paid AI data can belong to a signed-in user.

## Scope

In scope:

- Add frontend login/logout flow.
- Protect backend APIs that require user identity.
- Keep public health/docs endpoints available as appropriate.

Out of scope:

- Billing provider integration.
- Team accounts.
- Role-based admin features.

## Required Changes

- Choose and configure the agreed auth provider for local/test use.
- Add backend security configuration.
- Update frontend API calls to include auth.

## Tests

- Unauthenticated protected requests are rejected.
- Authenticated requests succeed.
- Frontend shows login state.

## Validation

Run `npm run verify`.

## Acceptance Criteria

- [ ] Users can sign in and out.
- [ ] Protected APIs require authentication.
- [ ] Auth is documented for local setup.

## Commit

```text
task-051: add authentication
```
