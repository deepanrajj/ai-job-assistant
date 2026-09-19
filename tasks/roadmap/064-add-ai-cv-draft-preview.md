# Task 064 - Add AI CV Draft Preview

Status: Not started

Related plan: [Product improvements - profile evidence](../../docs/business/product-improvements-and-recommendations-plan.md#ai-claims-need-profile-evidence).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

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
- Reuse task 063's profile-evidence contract for factual claims. Capture
  sources for the run and validate references in the backend. Do not
  invent employers, dates, qualifications, achievements, or metrics.
- Flag unsupported claims for editing, removal, or explicit user
  confirmation. Preserve unresolved flags when saving drafts; user
  confirmation is user supplied, not profile-backed evidence.

## Tests

- CV draft sections render editable.
- Edited draft can be saved.
- Missing job/profile produces useful validation.
- Unsupported claims and invalid references remain visible after saving;
  editing/removal/confirmation does not fabricate profile evidence.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI CV draft is editable in-app.
- [ ] Draft can be saved as application content.
- [ ] Factual claims carry inspectable evidence or an explicit review state.
- [ ] Export is not required.

## Commit

```text
task-064: add ai cv draft preview
```
