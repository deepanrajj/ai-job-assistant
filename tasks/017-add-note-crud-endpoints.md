# Task 017 - Add Note CRUD Endpoints

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Complete backend CRUD behavior for job notes.

## Scope

In scope:

- Ensure note list, create, update, and delete routes work end to end.
- Return stable response models for frontend integration.

Out of scope:

- Frontend integration.
- Authentication ownership.
- AI answer-to-note behavior.

## Required Changes

- Fill gaps left by Tasks 013-016.
- Add missing tests for note CRUD behavior.

## Tests

- List notes for a job.
- Create note.
- Update note.
- Delete note.
- Missing job/note errors.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Note CRUD works through HTTP.
- [ ] Response contracts are typed and stable.
- [ ] Backend verification passes.

## Commit

```text
task-017: add note crud endpoints
```
