# Task 076 - Deploy Backend

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, `../docs/context.md`, and deployment docs before starting.

## Goal

Deploy the backend to the selected hosting target.

## Scope

In scope:

- Configure backend production environment.
- Deploy backend service.
- Verify health, Swagger/OpenAPI, database, OpenAI, and Stripe configuration as applicable.

Out of scope:

- Frontend deployment.
- Committing secret values.
- Changing API behavior during deployment.

## Required Changes

- Set provider secrets outside Git.
- Run deployment and smoke checks.
- Document deployment URL and operational notes.

## Tests

- Backend verify passes before deploy.
- Health endpoint responds after deploy.
- Protected/API endpoints behave as expected.

## Validation

Run `npm run backend:verify` before deployment.

## Acceptance Criteria

- [ ] Backend is deployed.
- [ ] Health checks pass.
- [ ] No secrets are committed.

## Commit

```text
task-076: deploy backend
```
