# Task 007 - Add Job CRUD Endpoints

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Complete backend CRUD behavior for jobs.

## Scope

In scope:

- Ensure list, detail, create, update, and delete routes work end to
  end.
- Return stable response models for frontend integration.
- Keep errors consistent with `ApiExceptionHandler`.

Out of scope:

- Frontend integration.
- Authentication ownership.
- Task/note/timeline endpoints.

## Required Changes

- Fill gaps left by Tasks 003-006.
- Add missing controller/service tests for full CRUD.
- Update Swagger docs only if generated docs need clarification.

## Tests

- List jobs.
- Read one job.
- Create job.
- Update job.
- Delete job.
- Missing job returns the expected error.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job CRUD works through HTTP.
- [ ] Response contracts are typed and stable.
- [ ] Backend verification passes.

## Commit

```text
task-007: add job crud endpoints
```
