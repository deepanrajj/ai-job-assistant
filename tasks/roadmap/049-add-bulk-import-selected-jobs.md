# Task 049 - Add Bulk Import Selected Jobs

Status: In progress - frontend complete behind task 047's flag, import
endpoint pending

Progress is tracked in the
[plan](../../docs/business/049-add-bulk-import-selected-jobs-plan.md#progress).
The import endpoint is part of task 047's backend; its dev mock lives in
047's `importCandidates.mock.ts` and goes with it.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Let users import selected reviewed candidates as saved jobs.

## Scope

In scope:

- Convert selected candidates into saved jobs.
- Preserve source URL and imported metadata.
- Show import success and failure feedback.

Out of scope:

- AI discovery.
- Automatic import without review.
- Duplicate blocking beyond default selection.

## Required Changes

- Add bulk import action.
- Reuse existing job creation data path.
- Update candidate status after import.

## Tests

- Selected candidates become jobs.
- Unselected candidates are not imported.
- Failure feedback is shown.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Users can bulk import reviewed candidates.
- [ ] Imported jobs keep source data.
- [ ] No candidate is imported without user confirmation.

## Commit

```text
task-049: add bulk import selected jobs
```
