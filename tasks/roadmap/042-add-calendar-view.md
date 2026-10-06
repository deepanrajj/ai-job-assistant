# Task 042 - Add Calendar View

Status: In progress - frontend complete behind a feature flag, backend pending

Progress is tracked in the
[plan](../../docs/business/042-add-calendar-view-plan.md#progress).

- [ ] **Remove the temporary calendar mock and feature flag once the
  backend lands.** Delete `frontend/src/services/calendar/calendar.mock.ts`
  and its test, the `USE_MOCK_CALENDAR` branch and import in
  `calendar.service.ts`, and `CALENDAR_FEATURE_ENABLED` with the places
  that read it. Until then built images keep Calendar on "coming soon",
  and the mock runs only in the Vite dev server.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Show interviews, deadlines, follow-ups, and task due dates in one calendar-oriented view.

## Scope

In scope:

- Add Calendar page using existing task/reminder/document dates.
- Group events by date.
- Link calendar items back to job detail.

Out of scope:

- External calendar sync.
- Recurring events.
- Timezone-heavy scheduling logic.

Calendar-file export and external delivery are separate follow-up R-09
in the [product improvements plan](../../docs/business/product-improvements-and-recommendations-plan.md#reminder-delivery-is-a-separate-follow-up).
Date-only reminders remain calendar dates, not invented midnight UTC
appointments. Timed interview rounds and their timezone model belong to
R-02 before they can be exported as timed events.

## Required Changes

- Create a responsive calendar/list hybrid view.
- Add empty and loading states if data is asynchronous.
- Update route tests and translations.

## Tests

- Calendar groups events by date.
- Items link to the correct job.
- Empty state renders when no events exist.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Calendar route exists.
- [ ] Relevant dated job events are visible.
- [ ] The view works on mobile.

## Commit

```text
task-042: add calendar view
```
