# Task 004 - Create Job Repository

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add repository access for persisted jobs.

## Scope

In scope:

- Add a Spring Data repository for the job entity.
- Add query methods needed by the upcoming job service.

Out of scope:

- HTTP endpoints.
- Task, note, or timeline repositories.
- Authentication-specific scoping.

## Required Changes

- Create the repository in the `jobs` package.
- Keep query names explicit and minimal.

## Tests

- Add repository tests if persistence test infrastructure exists.
- Otherwise cover repository behavior through the first service or
  integration task that uses it.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job repository compiles.
- [ ] Query methods match service needs.
- [ ] No unrelated persistence code is added.

## Commit

```text
task-004: create job repository
```
