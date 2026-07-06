# Task 005 - Create Job Service

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

Related plan: `../docs/business/005-create-job-service-plan.md`.

## Goal

Add backend business logic for job operations.

## Scope

In scope:

- Create a job service for list, read, create, update, and delete
  behavior.
- Define service-level request/command models if needed.
- Convert missing jobs into typed API errors.

Out of scope:

- Controller routing.
- Task, note, and timeline behavior.
- Authentication ownership rules.

## Required Changes

- Add service methods needed by job CRUD.
- Add focused unit tests for service behavior.
- Reuse existing API error patterns.

## Tests

- Covers successful create/update/delete flows.
- Covers missing job behavior.
- Covers status or date defaults if introduced here.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [x] Job service owns job business logic.
- [x] Errors use the shared API error model.
- [x] Service tests cover behavior.

## Commit

```text
task-005: create job service
```
