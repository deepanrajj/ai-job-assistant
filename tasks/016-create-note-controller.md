# Task 016 - Create Note Controller

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Expose job note operations through Spring MVC routes.

## Scope

In scope:

- Add note request and response DTOs.
- Add controller methods under the job/note API shape chosen by the
  backend conventions.
- Validate note requests.

Out of scope:

- Frontend integration.
- AI answer-to-note behavior.

## Required Changes

- Keep controller code thin.
- Reuse note service behavior.
- Add controller tests.

## Tests

- Successful note create/update/delete/list.
- Validation errors.
- Missing parent job or note error mapping.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Note controller routes exist.
- [ ] Requests validate correctly.
- [ ] Controller tests cover success and error behavior.

## Commit

```text
task-016: create note controller
```
