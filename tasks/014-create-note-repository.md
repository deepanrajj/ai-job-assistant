# Task 014 - Create Note Repository

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add repository access for job notes.

## Scope

In scope:

- Add a Spring Data repository for notes.
- Add query methods needed by the note service.

Out of scope:

- Controllers and HTTP endpoints.
- AI answer-to-note behavior.

## Required Changes

- Keep note queries scoped by job id where relevant.
- Avoid unused repository methods.

## Tests

- Add repository coverage if persistence tests exist, or cover through
  note service tests.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Note repository compiles.
- [ ] Queries support the upcoming service.
- [ ] No unrelated persistence code is added.

## Commit

```text
task-014: create note repository
```
