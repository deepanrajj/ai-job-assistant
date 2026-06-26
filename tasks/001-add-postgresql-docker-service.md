# Task 001 - Add PostgreSQL Docker Service

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, and
`../docs/infrastructure.md` before starting.

## Goal

Add a local PostgreSQL service for Smart Job Tracker development.

## Scope

In scope:

- Add PostgreSQL to the local runtime in the smallest repo-consistent way.
- Document host, port, database, user, and password placeholders.
- Keep secrets out of Git.

Out of scope:

- Flyway migrations.
- JPA entities.
- Application code changes.

## Required Changes

- Add or update local infrastructure files for PostgreSQL.
- Add non-secret environment examples if needed.
- Update setup/infrastructure docs if the local startup flow changes.

## Tests

- Verify the database container/service starts locally.
- Verify no real credentials are committed.

## Validation

Run the relevant infrastructure command and `npm run verify` if code or
config that affects builds changed.

## Acceptance Criteria

- [ ] PostgreSQL can run locally.
- [ ] Connection details are documented.
- [ ] No secrets are committed.

## Commit

```text
task-001: add postgresql docker service
```
