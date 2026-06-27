# Task 063 - Add AI Job Fit Ranking

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Compare a saved job against a selected profile and show fit guidance.

## Scope

In scope:

- Add fit score, matched skills, missing skills, and explanation.
- Run from job detail using a selected profile.
- Save fit result as job AI output.

Out of scope:

- Auto-rejecting jobs.
- Cross-job ranking dashboard.
- Vector search.

## Required Changes

- Add backend fit ranking operation.
- Add job detail UI for selecting profile and viewing result.
- Persist confirmed or generated fit output.

## Tests

- Fit result renders score and skill lists.
- Missing profile/job data is handled.
- Result can be regenerated.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Users can rank job fit.
- [ ] Fit output is explainable.
- [ ] No job status changes automatically.

## Commit

```text
task-063: add ai job fit ranking
```
