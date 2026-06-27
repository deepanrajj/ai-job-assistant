# Task 066 - Add AI Review Controls And Source Display

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Give users safe controls for reviewing, regenerating, and saving AI output.

## Scope

In scope:

- Add regenerate controls for AI outputs.
- Allow saving AI output as note, document, or task where appropriate.
- Show source links for AI-discovered jobs.

Out of scope:

- RAG source previews.
- Auto-saving AI output.
- New AI operation types.

## Required Changes

- Merge save-as-note and generated-task selection behavior into reusable review controls.
- Keep source display focused on discovered job source URLs.
- Add accessible controls and feedback.

## Tests

- AI output can be regenerated.
- Answer/material can be saved as note or document.
- Generated tasks require user selection before saving.
- Discovery sources render accessibly.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI outputs are reviewable.
- [ ] Users decide what to save.
- [ ] Source links are visible for discovered jobs.

## Commit

```text
task-066: add ai review controls and source display
```
