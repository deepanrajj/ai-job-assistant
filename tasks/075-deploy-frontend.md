# Task 075 - Deploy Frontend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../docs/context.md`, and deployment docs before starting.

## Goal

Deploy the frontend to the selected hosting target.

## Scope

In scope:

- Configure frontend production environment.
- Deploy built frontend.
- Verify route refresh/deep links work.

Out of scope:

- Backend deployment.
- Changing frontend product scope.
- Committing provider secrets.

## Required Changes

- Set required environment variables in the hosting provider.
- Document deployment URL and verification steps.
- Update README if appropriate.

## Tests

- Production build succeeds.
- Deployed app loads.
- Known routes refresh without 404.

## Validation

Run `npm run frontend:verify` before deployment.

## Acceptance Criteria

- [ ] Frontend is deployed.
- [ ] Deep links work.
- [ ] No secrets are committed.

## Commit

```text
task-075: deploy frontend
```
