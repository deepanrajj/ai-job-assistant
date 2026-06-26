# Task 056 - Add Deployment Notes

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, `../docs/infrastructure.md`,
and `../README.md` before starting.

## Goal

Document deployment direction for the frontend and backend.

## Scope

In scope:

- Document intended deployment targets.
- Document required environment variables.
- Document build and health-check expectations.

Out of scope:

- Actually deploying frontend or backend.
- Committing secrets.
- Replacing local Kubernetes docs.

## Required Changes

- Add deployment notes under docs or README as appropriate.
- Keep local setup docs separate from deployment notes.
- Include rollback or verification notes only if known.

## Tests

- No unit tests required.
- Manually verify docs links and commands.

## Validation

Run `npm run verify` only if code changed.

## Acceptance Criteria

- [ ] Deployment path is documented.
- [ ] Required environment variables are listed without values.
- [ ] Local and deployment instructions are not mixed up.

## Commit

```text
task-056: add deployment notes
```
