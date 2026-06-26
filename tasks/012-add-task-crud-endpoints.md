# Task 012 - Add Task CRUD Endpoints

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Complete backend CRUD behavior for job tasks.

## Scope

In scope:

- Ensure task list, create, update, and delete routes work end to end.
- Return stable response models for frontend integration.

Out of scope:

- Frontend integration.
- Authentication ownership.
- Timeline automation unless explicitly introduced by this task.

## Required Changes

- Fill gaps left by Tasks 008-011.
- Add missing tests for task CRUD behavior.

## Tests

- List tasks for a job.
- Create task.
- Update task.
- Delete task.
- Missing job/task errors.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Task CRUD works through HTTP.
- [ ] Response contracts are typed and stable.
- [ ] Backend verification passes.

## Commit

```text
task-012: add task crud endpoints
```
