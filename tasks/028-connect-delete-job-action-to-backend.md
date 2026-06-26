# Task 028 - Connect Delete Job Action To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Delete jobs through the backend API.

## Scope

In scope:

- Wire existing delete UI to the job delete service.
- Navigate or refresh state after successful deletion.
- Show API errors accessibly.

Out of scope:

- Adding confirmation modals unless the existing UI already uses one.
- Backend contract changes.
- Bulk delete behavior.

## Required Changes

- Replace local delete behavior with API behavior.
- Add tests for success and error states.
- Preserve keyboard accessibility.

## Tests

- Delete action calls backend.
- Successful delete removes the job from visible UI or navigates away.
- API error is shown.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Delete uses backend API.
- [ ] UI updates after successful delete.
- [ ] Error behavior is tested.

## Commit

```text
task-028: connect delete job action to backend
```
