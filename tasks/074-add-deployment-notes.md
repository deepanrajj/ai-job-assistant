# Task 074 - Add Deployment Notes

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, `../docs/setup.md`, and `../docs/infrastructure.md` before starting.

## Goal

Document how to deploy the frontend and backend safely.

## Scope

In scope:

- Document deployment targets, environment variables, secrets, and build commands.
- Include OpenAI and Stripe secret handling.
- Keep local Kubernetes docs intact.

Out of scope:

- Actually deploying services.
- Committing secret values.
- Choosing a new cloud provider.

## Required Changes

- Add deployment documentation.
- Document rollback/check steps.
- Update README links.

## Tests

- Verify docs links resolve.
- Verify commands match package scripts.

## Validation

Run docs/link checks where practical.

## Acceptance Criteria

- [ ] Deployment notes exist.
- [ ] Secrets are documented by name only.
- [ ] Local runtime docs still work.

## Commit

```text
task-074: add deployment notes
```
