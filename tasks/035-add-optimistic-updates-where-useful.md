# Task 035 - Add Optimistic Updates Where Useful

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Improve perceived speed for safe frontend mutations.

## Scope

In scope:

- Add optimistic updates only for low-risk interactions where rollback
  is clear.
- Candidate areas: task status changes, note edits, and job status
  changes.

Out of scope:

- Optimistic create/delete behavior if rollback would be confusing.
- Adding Redux, RTK Query, or another data library.
- Backend changes.

## Required Changes

- Identify eligible mutations first.
- Implement rollback on API failure.
- Keep UI state predictable and tested.

## Tests

- Optimistic success path updates immediately.
- API failure rolls back and shows an error.
- Non-eligible mutations remain request-driven.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Optimistic updates exist only where useful and safe.
- [ ] Rollback behavior is tested.
- [ ] No new state library is introduced.

## Commit

```text
task-035: add optimistic updates where useful
```
