# Task 003 - Create Job Entity

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Create the backend persistence model for saved jobs.

## Scope

In scope:

- Add the job table through a new Flyway migration.
- Add a Kotlin entity for jobs.
- Represent fields from the planned `Job` model in `docs/context.md`.

Out of scope:

- Repository queries beyond basic persistence needs.
- Controllers or HTTP endpoints.
- Authentication ownership enforcement.

## Required Changes

- Add the migration for the jobs table.
- Add the JPA entity in a `jobs` package.
- Keep entity and API DTO concerns separate.

## Tests

- Add persistence or migration coverage if the backend test setup
  supports it after Task 002.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job schema is represented by a Flyway migration.
- [ ] Job entity maps the schema.
- [ ] No API contract is introduced yet.

## Commit

```text
task-003: create job entity
```
