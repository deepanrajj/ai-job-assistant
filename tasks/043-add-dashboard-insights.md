# Task 043 - Add Dashboard Insights

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Make the dashboard useful for job-search progress and next actions.

## Scope

In scope:

- Add applications this week, response rate, interview rate, aging applications, and next actions.
- Compute insights from saved tracker data.
- Keep calculations deterministic and explainable.

Out of scope:

- AI insights.
- Charts requiring new dependencies.
- Backend analytics tables.

## Required Changes

- Add dashboard utility calculations.
- Render compact insight cards and next-action sections.
- Cover calculations with unit tests.

## Tests

- Insight calculations handle empty data.
- Rates and aging values are correct.
- Dashboard renders next actions.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Dashboard shows meaningful tracker insights.
- [ ] Calculations are tested.
- [ ] No AI is required.

## Commit

```text
task-043: add dashboard insights
```
