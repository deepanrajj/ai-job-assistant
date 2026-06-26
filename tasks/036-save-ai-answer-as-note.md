# Task 036 - Save AI Answer As Note

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Allow a user to save an AI answer as a job note.

## Scope

In scope:

- Add a save-as-note action for AI answers in the saved job workflow.
- Persist the note through the current job note data path.
- Preserve the original AI answer display.

Out of scope:

- RAG sources.
- AI answer caching.
- New note editor design.

## Required Changes

- Wire the AI answer UI to note creation.
- Reuse existing note service/provider behavior.
- Add success and error feedback.

## Tests

- AI answer renders a save action.
- Saving creates a note with the answer body.
- Failure shows an error and keeps the answer visible.

## Validation

Run the relevant frontend/backend verification for touched layers.

## Acceptance Criteria

- [ ] AI answers can become notes.
- [ ] Note creation uses existing note behavior.
- [ ] Tests cover success and failure.

## Commit

```text
task-036: save ai answer as note
```
