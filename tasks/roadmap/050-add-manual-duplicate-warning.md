# Task 050 - Add Manual Duplicate Warning

Status: Completed - frontend only, no backend work

See the [plan](../../docs/business/050-add-manual-duplicate-warning-plan.md#verified-state).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Warn users about similar jobs during manual add/edit without blocking creation.

## Scope

In scope:

- Run deterministic duplicate detection during manual job create/edit.
- Show a non-blocking warning with matching jobs.
- Allow users to continue anyway.

Out of scope:

- Preventing duplicates.
- AI duplicate scoring.
- Import candidate behavior already covered by Task 048.

## Required Changes

- Add duplicate warning UI to job form.
- Reuse duplicate matching rules from import workflow.
- Add tests for warning and continue behavior.

## Tests

- Duplicate warning appears when similar saved job exists.
- User can submit despite warning.
- No warning appears when no match exists.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [x] Manual create/edit warns on duplicates.
- [x] Users can override the warning.
- [x] Duplicate logic is shared with import where practical.

## Commit

```text
task-050: add manual duplicate warning
```
