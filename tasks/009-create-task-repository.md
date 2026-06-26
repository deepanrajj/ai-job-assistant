# Task 009 - Create Task Repository

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add repository access for job preparation tasks.

## Scope

In scope:

- Add a Spring Data repository for tasks.
- Add query methods needed for task service behavior.

Out of scope:

- Controllers and HTTP endpoints.
- Notes and timeline behavior.

## Required Changes

- Keep task queries scoped by job id where relevant.
- Avoid adding unused repository methods.

## Tests

- Add repository coverage if persistence tests exist, or cover through
  task service tests.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Task repository compiles.
- [ ] Queries support the upcoming service.
- [ ] No unrelated methods are added.

## Commit

```text
task-009: create task repository
```
