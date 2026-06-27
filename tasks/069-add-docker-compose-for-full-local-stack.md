# Task 069 - Add Docker Compose For Full Local Stack

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, `../docs/setup.md`, and `../docs/infrastructure.md` before starting.

## Goal

Provide a simple Docker Compose option for running the full local stack.

## Scope

In scope:

- Add compose services for frontend, backend, and database.
- Document environment variables.
- Keep Kubernetes runtime working.

Out of scope:

- Replacing local Kubernetes.
- Production deployment.
- Cloud secrets.

## Required Changes

- Add compose configuration.
- Add setup docs.
- Keep ports and service names consistent with existing docs.

## Tests

- Compose configuration validates.
- Services can start locally with documented env values.
- Existing Kubernetes scripts are not broken.

## Validation

Run relevant Docker/compose validation and `npm run verify` if code changes are made.

## Acceptance Criteria

- [ ] Docker Compose stack is documented.
- [ ] Local Kubernetes remains supported.
- [ ] No secrets are committed.

## Commit

```text
task-069: add docker compose for full local stack
```
