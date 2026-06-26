# Task 006 - Create Job Controller

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Expose backend job operations through a Spring MVC controller.

## Scope

In scope:

- Add job request and response DTOs.
- Add controller routes for job operations.
- Add Bean Validation to request DTOs.

Out of scope:

- Task, note, or timeline endpoints.
- Frontend service integration.
- Authentication.

## Required Changes

- Keep DTOs separate from the controller body.
- Reuse the job service from Task 005.
- Let Springdoc generate endpoint documentation from the controller.

## Tests

- Add controller tests for success responses.
- Add validation/error response tests.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job controller routes exist.
- [ ] Requests validate correctly.
- [ ] Controller tests cover success and validation errors.

## Commit

```text
task-006: create job controller
```
