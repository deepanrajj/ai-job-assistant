# Task 062 - Add AI Resume Profile Extraction

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Extract an editable structured profile from pasted resume text.

## Scope

In scope:

- Add resume text input flow in Profile.
- Use backend AI to extract profile sections and skills.
- Let user edit before saving.

Out of scope:

- File upload parsing.
- PDF/DOCX export.
- Auto-saving AI output without review.

## Required Changes

- Add backend extraction operation and schema.
- Add frontend review/edit UI.
- Persist only user-confirmed profile data.

## Tests

- Extraction result renders in editable form.
- User can save edited profile.
- Failed extraction shows useful error.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Resume text can become an editable profile draft.
- [ ] User review is required before save.
- [ ] Extracted skills populate profile data.

## Commit

```text
task-062: add ai resume profile extraction
```
