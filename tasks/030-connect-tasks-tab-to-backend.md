# Task 030 - Connect Tasks Tab To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Use backend APIs for job detail task behavior.

## Scope

In scope:

- Load tasks for the current job.
- Create, update, and delete tasks through the task service.
- Show loading and error states in the tasks tab.

Out of scope:

- Notes tab integration.
- Optimistic updates unless already covered by task 035.

## Required Changes

- Replace local task callbacks with service-backed behavior.
- Preserve accessible form controls and buttons.
- Add tests for task CRUD user flows.

## Tests

- Tasks load from backend.
- User can create, update, and delete a task.
- API error state is shown.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Tasks tab uses backend APIs.
- [ ] Existing UI behavior is preserved.
- [ ] Tests cover task user flows.

## Commit

```text
task-030: connect tasks tab to backend
```
