# Task 031 - Connect Notes Tab To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Use backend APIs for job detail note behavior.

## Scope

In scope:

- Load notes for the current job.
- Create, update, and delete notes through the note service.
- Show loading and error states in the notes tab.

Out of scope:

- Tasks tab integration.
- Saving AI answers as notes.
- Optimistic updates unless covered by task 035.

## Required Changes

- Replace local note callbacks with service-backed behavior.
- Preserve accessible form controls and buttons.
- Add tests for note CRUD user flows.

## Tests

- Notes load from backend.
- User can create, update, and delete a note.
- API error state is shown.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Notes tab uses backend APIs.
- [ ] Existing UI behavior is preserved.
- [ ] Tests cover note user flows.

## Commit

```text
task-031: connect notes tab to backend
```
