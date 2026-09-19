# Task 043 - Add Dashboard Insights

Status: Not started

Related plan: [Product improvements - analytics history](../../docs/business/product-improvements-and-recommendations-plan.md#analytics-must-use-history).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Make the dashboard useful for job-search progress and next actions.

## Scope

In scope:

- Add applications this week, interview rate, aging applications, next
  actions, and an explained response-rate availability state.
- Compute insights from saved tracker data.
- Keep calculations deterministic and explainable.
- Show response rate as unavailable with an explanation until explicit
  employer-response data exists; do not infer it from current status.

Out of scope:

- AI insights.
- Charts requiring new dependencies.
- Backend analytics tables.
- Adding missing backend history/response APIs inside this frontend task.

## Dependencies And Metric Definitions

- Tasks 018/019 supply structured status history and bounded cross-job
  reads; task 032 supplies the frontend history integration. Task 040
  supplies reminders for next actions. Do not issue a history request
  per dashboard row.
- Use the first recorded APPLIED transition as the recorded application
  date. Never substitute createdAt or updatedAt. Existing/imported jobs
  without that event have unknown dates and are shown separately.
- Apply the related plan's Monday-based browser-local week, calendar-day
  aging, application-date cohort, and historical INTERVIEW-event rules.
  Label the period/cohort and show counts with rates.
- Fetch all history pages needed for a calculation before showing its
  result; partial/error history must not produce a numeric metric.
- A zero denominator produces unavailable, not 0%. Unknown history and
  response data must be distinguished from known zero counts.
- Numeric response rate is a separate follow-up after R-11 defines
  response capture. This task must explain the unavailable metric and
  must not claim to have implemented numeric response analytics.

## Required Changes

- Add dashboard utility calculations.
- Render compact insight cards and next-action sections.
- Cover calculations with unit tests.

## Tests

- Insight calculations handle empty data.
- Rates and aging values are correct.
- Description edits do not reset application age; repeated APPLIED
  transitions do not double-count an application.
- Jobs now in OFFER/REJECTED still contribute a recorded interview;
  a direct transition to OFFER does not imply one.
- Unknown dates/responses, zero denominators, week boundaries, daylight
  saving transitions, and partial/failed history loads are handled.
- Dashboard renders next actions.

## Validation

Run the affected Vitest files, `npm run frontend:verify`, then
`npm run verify`.

## Acceptance Criteria

- [ ] Dashboard shows meaningful tracker insights.
- [ ] Calculations are tested.
- [ ] Metrics use structured history and display their period and counts.
- [ ] Missing evidence produces an explained unavailable state.
- [ ] No AI is required.

## Commit

```text
task-043: add dashboard insights
```
