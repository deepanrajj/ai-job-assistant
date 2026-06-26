# Task 050 - Add Backend Integration Tests

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add backend integration tests for persisted tracker behavior.

## Scope

In scope:

- Add integration tests for database-backed job tracker flows.
- Use the existing backend test style and Gradle verification.

Out of scope:

- Rewriting unit tests.
- Weakening JaCoCo coverage gates.
- Adding test containers unless explicitly justified.

## Required Changes

- Identify the smallest integration test setup that matches the repo.
- Cover key API + persistence flows.
- Document any local test database assumptions.

## Tests

- Job CRUD persists data.
- Task/note CRUD persists under a job.
- Timeline events persist on status change.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Integration tests cover persisted tracker flows.
- [ ] Tests run through backend verification.
- [ ] Existing unit tests remain intact.

## Commit

```text
task-050: add backend integration tests
```
