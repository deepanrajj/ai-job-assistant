# Task 065 - Add AI Application Material Drafts

Status: Not started

Related plan: [Product improvements - profile evidence](../../docs/business/product-improvements-and-recommendations-plan.md#ai-claims-need-profile-evidence).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

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
- Reuse task 063's evidence contract for factual profile claims in
  generated materials. Validate captured references in the backend and
  flag unsupported claims; do not invent work history or achievements.
- Preserve evidence/review state in saved drafts. An explicit user
  confirmation must be distinguished from support in the original
  profile. Reuse the review behavior from task 064.

## Tests

- Each material type can be requested.
- Draft output is editable.
- User can save selected draft.
- Invalid references and unsupported claims are flagged and remain
  flagged after a draft save unless explicitly resolved by the user.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Application material drafts are available.
- [ ] All outputs require review before save.
- [ ] Saved drafts are connected to the job.
- [ ] Factual claims retain evidence or explicit user-review state.

## Commit

```text
task-065: add ai application material drafts
```
