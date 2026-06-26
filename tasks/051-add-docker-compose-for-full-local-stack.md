# Task 051 - Add Docker Compose For Full Local Stack

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, and
`../docs/infrastructure.md` before starting.

## Goal

Provide a Docker Compose alternative for running the full local stack.

## Scope

In scope:

- Add compose services for frontend, backend, and database.
- Keep Kubernetes as the default production-like local runtime unless
  docs intentionally change that.
- Use environment placeholders, not real secrets.

Out of scope:

- Replacing Kubernetes manifests.
- Production deployment.

## Required Changes

- Add compose configuration.
- Document startup, shutdown, and URLs.
- Ensure frontend-to-backend proxying works in compose.

## Tests

- Verify compose stack starts locally.
- Verify frontend and backend health endpoints are reachable.

## Validation

Run relevant Docker Compose commands and `npm run verify` if code
changes are needed.

## Acceptance Criteria

- [ ] Compose starts the full local stack.
- [ ] Docs explain when to use compose vs Kubernetes.
- [ ] No secrets are committed.

## Commit

```text
task-051: add docker compose for full local stack
```
