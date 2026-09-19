# Task 066 - Add AI Review Controls And Source Display

Status: Not started

Related plan: [Product improvements - profile evidence](../../docs/business/product-improvements-and-recommendations-plan.md#ai-claims-need-profile-evidence).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Give users safe controls for reviewing, regenerating, and saving AI output.

## Scope

In scope:

- Add regenerate controls for AI outputs.
- Allow saving AI output as note, document, or task where appropriate.
- Show source links for AI-discovered jobs.
- Consolidate the profile-evidence inspection and unsupported-claim
  review behavior delivered in tasks 063-065.

Out of scope:

- RAG source previews.
- Auto-saving AI output.
- New AI operation types.

## Required Changes

- Merge save-as-note and generated-task selection behavior into reusable review controls.
- Keep discovered-job URLs distinct from the captured profile entries
  supporting fit and draft claims. Neither requires RAG source previews.
- Preserve evidence and unresolved flags across edit/save/regenerate
  flows; regeneration needs a new review. Edited claims need review
  again, and confirmation must not become fabricated profile evidence.
- Add accessible controls and feedback.

## Tests

- AI output can be regenerated.
- Answer/material can be saved as note or document.
- Generated tasks require user selection before saving.
- Discovery sources render accessibly.
- Users can inspect profile evidence and edit/remove/confirm unsupported
  statements. Saved unresolved drafts keep their flags.
- Regeneration does not reuse a previous output's approval state.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI outputs are reviewable.
- [ ] Users decide what to save.
- [ ] Source links are visible for discovered jobs.
- [ ] Profile evidence and unsupported-claim review work across AI outputs.

## Commit

```text
task-066: add ai review controls and source display
```
