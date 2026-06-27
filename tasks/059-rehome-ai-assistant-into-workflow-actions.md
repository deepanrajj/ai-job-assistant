# Task 059 - Rehome AI Assistant Into Workflow Actions

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Move the current AI Assistant capability into real job workflows.

## Scope

In scope:

- Expose analyze/ask actions from Add Job, Job Detail, and Discover/import flows.
- Remove `AI Assistant` as a final top-level product navigation item.
- Preserve useful existing AI behavior.

Out of scope:

- Deleting backend AI endpoints if still used by workflow actions.
- Adding new AI features beyond rehoming.
- Billing implementation already covered by Phase 6.

## Required Changes

- Update routes/navigation and workflow UI entry points.
- Reuse existing AI services where possible.
- Update tests and translations.

## Tests

- AI actions are available from relevant workflows.
- `AI Assistant` is not required as top-level nav.
- Existing AI analyze/ask behavior still works.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI feels embedded in workflows.
- [ ] No generic assistant nav is required.
- [ ] Existing AI behavior is preserved.

## Commit

```text
task-059: rehome ai assistant into workflow actions
```
