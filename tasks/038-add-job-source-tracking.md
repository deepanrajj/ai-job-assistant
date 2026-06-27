# Task 038 - Add Job Source Tracking

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Track where each saved job came from.

## Scope

In scope:

- Add source fields to job models/forms.
- Support sources such as LinkedIn, company website, Indeed, AI search, referral, and other.
- Show source on job list/detail where useful.

Out of scope:

- Discover import workflow.
- Analytics beyond showing stored source.
- External provider integrations.

## Required Changes

- Update job types, form schema, translations, and display components.
- Persist source through the current data layer.
- Keep existing jobs compatible with an empty source.

## Tests

- Job form accepts source.
- Saved source appears on job detail.
- Existing jobs without source still render.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Jobs can store a source.
- [ ] Source is visible in the UI.
- [ ] No existing job data breaks.

## Commit

```text
task-038: add job source tracking
```
