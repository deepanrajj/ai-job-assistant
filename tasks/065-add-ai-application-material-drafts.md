# Task 065 - Add AI Application Material Drafts

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Generate editable cover letters and outreach messages for a selected job/profile.

## Scope

In scope:

- Support cover letter, recruiter message, LinkedIn outreach, and "why this role?" answer.
- Render editable drafts.
- Save drafts as application documents or notes.

Out of scope:

- Email/LinkedIn sending.
- PDF/DOCX export.
- Auto-saving without user review.

## Required Changes

- Add backend material generation operation.
- Add Applications/job detail UI entry points.
- Reuse save-as-note/document behavior.

## Tests

- Each material type can be requested.
- Draft output is editable.
- User can save selected draft.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Application material drafts are available.
- [ ] All outputs require review before save.
- [ ] Saved drafts are connected to the job.

## Commit

```text
task-065: add ai application material drafts
```
