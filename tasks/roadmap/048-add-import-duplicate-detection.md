# Task 048 - Add Import Duplicate Detection

Status: Completed - frontend only, no backend work; visible in built
images once task 047's `IMPORT_CANDIDATES_FEATURE_ENABLED` is removed

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Classify imported candidates as new, likely duplicate, or possible duplicate before bulk import.

## Scope

In scope:

- Add deterministic duplicate detection for candidates against saved jobs.
- Use same URL, company plus role, and normalized title plus location signals.
- Exclude likely duplicates by default from bulk import selection.

Out of scope:

- AI similarity scoring.
- Blocking manual job creation.
- Cross-user duplicate detection.

## Required Changes

- Add duplicate classification utility/service.
- Show duplicate status in candidate review.
- Add tests for exact and fuzzy deterministic cases.

## Tests

- Same URL is likely duplicate.
- Similar company/title/location can be possible duplicate.
- Likely duplicates are excluded by default.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [x] Candidates get duplicate classifications.
- [x] Likely duplicates are not selected by default.
- [x] Manual review remains possible.

## Commit

```text
task-048: add import duplicate detection
```
