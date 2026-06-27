# Task 064 - Add AI CV Draft Preview

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Generate editable in-app CV sections from a selected job and profile.

## Scope

In scope:

- Add CV draft operation using selected job and profile.
- Render editable in-app sections.
- Save draft as application document metadata/content.

Out of scope:

- PDF/DOCX export.
- Replacing full resume builder.
- Auto-submitting applications.

## Required Changes

- Add backend CV draft operation and response schema.
- Add Applications UI for draft preview/edit/save.
- Connect saved draft to job application documents.

## Tests

- CV draft sections render editable.
- Edited draft can be saved.
- Missing job/profile produces useful validation.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI CV draft is editable in-app.
- [ ] Draft can be saved as application content.
- [ ] Export is not required.

## Commit

```text
task-064: add ai cv draft preview
```
