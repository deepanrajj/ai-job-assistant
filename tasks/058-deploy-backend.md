# Task 058 - Deploy Backend

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, `../docs/context.md`, and
deployment notes before starting.

## Goal

Deploy the backend to the chosen hosting target.

## Scope

In scope:

- Configure backend deployment settings.
- Set required secret/environment variables in the hosting platform.
- Verify health, Swagger, and API endpoints.

Out of scope:

- Frontend deployment.
- New backend features.
- Committing secrets.

## Required Changes

- Add deployment config only if it belongs in Git.
- Document manual hosting setup.
- Verify backend runtime profile and health checks.

## Tests

- `npm run backend:verify`.
- Manual smoke test against deployed backend.
- Verify `/api/ai/health` and Swagger docs.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Backend is deployed.
- [ ] Required secrets are configured outside Git.
- [ ] Health and API docs are reachable.

## Commit

```text
task-058: deploy backend
```
