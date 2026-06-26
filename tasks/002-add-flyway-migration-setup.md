# Task 002 - Add Flyway Migration Setup

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Enable Flyway as the backend schema migration tool.

## Scope

In scope:

- Add Flyway dependencies/configuration.
- Add the initial migration location and baseline migration if needed.
- Document how migrations run locally.

Out of scope:

- Job, task, note, or timeline tables.
- Application CRUD endpoints.

## Required Changes

- Configure backend database and Flyway properties.
- Add a migration folder under backend resources.
- Add tests or startup verification where practical.

## Tests

- Verify backend startup with Flyway enabled.
- Add a focused test if configuration behavior is covered in the repo.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Flyway runs on backend startup.
- [ ] Migration files have a clear naming convention.
- [ ] Backend verification passes.

## Commit

```text
task-002: add flyway migration setup
```
