# Task 061 - Add AI Job Discovery

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Let users generate reviewable job candidates from role, location, seniority, skills, and work-mode criteria.

## Scope

In scope:

- Add AI discovery request/response flow.
- Return structured candidates with source URLs when available.
- Run deterministic duplicate detection before showing import selection.

Out of scope:

- Auto-saving AI-found jobs.
- Direct browser OpenAI calls.
- Production job-provider integration if unavailable.

## Required Changes

- Add backend AI discovery operation.
- Add Discover UI action for AI-generated candidates.
- Reuse candidate review and duplicate classification workflows.

## Tests

- Discovery returns structured candidates.
- Candidates are not auto-saved.
- Duplicate detection runs before import selection.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI discovery creates reviewable candidates.
- [ ] Source URLs are shown when present.
- [ ] User confirms import manually.

## Commit

```text
task-061: add ai job discovery
```
