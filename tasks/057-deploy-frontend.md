# Task 057 - Deploy Frontend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../docs/context.md`, and
deployment notes before starting.

## Goal

Deploy the frontend to the chosen hosting target.

## Scope

In scope:

- Configure frontend build/deploy settings.
- Set environment variables needed by the deployed frontend.
- Verify routes, deep links, and API proxy/base URL behavior.

Out of scope:

- Backend deployment.
- New frontend features.
- Committing platform secrets.

## Required Changes

- Add deployment config only if it belongs in Git.
- Document any manual hosting setup that cannot be represented in code.
- Verify production build behavior.

## Tests

- `npm run frontend:verify`.
- Manual smoke test against deployed frontend.
- Deep-link refresh test for routes such as `/jobs`.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Frontend is deployed.
- [ ] Deep links work.
- [ ] API configuration is documented.

## Commit

```text
task-057: deploy frontend
```
