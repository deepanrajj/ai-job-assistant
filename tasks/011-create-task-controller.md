# Task 011 - Create Task Controller

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Expose job task operations through Spring MVC routes.

## Scope

In scope:

- Add task request and response DTOs.
- Add controller methods under the job/task API shape chosen by the
  backend conventions.
- Validate task requests.

Out of scope:

- Frontend integration.
- Notes and timeline routes.

## Required Changes

- Keep controller code thin.
- Reuse task service behavior.
- Add controller tests.

## Tests

- Successful task create/update/delete/list.
- Validation errors.
- Missing parent job or task error mapping.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Task controller routes exist.
- [ ] Requests validate correctly.
- [ ] Controller tests cover success and error behavior.

## Commit

```text
task-011: create task controller
```
