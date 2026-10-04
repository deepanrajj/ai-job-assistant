# Task 043 - Add Dashboard Insights Plan

Status: Completed

## Purpose

Turn the dashboard from a count of saved jobs into a view of job-search
progress: how many applications went out this week, how many led to an
interview, which applications have been waiting longest, and what to do
next. Every number comes from recorded status history, shows its period
and counts, and says plainly when there is not enough evidence to give
one. No AI and no backend change.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Analytics Must Use History": the metric rules this plan applies)
- `docs/business/040-add-reminders-plan.md` (the next-actions card)
- `tasks/roadmap/043-add-dashboard-insights.md`

## Current State

Read on `main` at `78720ec`.

- **Status history exists, but only for status changes.**
  `JobService.updateJob` writes a `STATUS_CHANGE` `TimelineEvent` with
  `previousStatus`, `nextStatus`, and `createdAt` in the same
  transaction as the job update, and only when the status changes.
  `createJob` writes no event, so a job saved directly as `APPLIED` has
  no recorded application. Editing a description writes no event.
- **A bounded cross-job read exists.** `GET /api/timeline-events?page=&size=`
  returns every event across every job, oldest first (`createdAt`, then
  `id`), as `{ content, page, size, totalElements, totalPages }`, with
  `size` clamped to `[1, 100]`. Each item carries `jobId`. The frontend
  has no service for it yet; `services/timeline` only wraps the per-job
  route.
- **Next actions exist.** Task 040 added the "Next reminders" dashboard
  card (open reminders and dated tasks, earliest first). It is hidden in
  built images by `REMINDERS_FEATURE_ENABLED` until 040's backend lands.
- **The dashboard** derives total, active, interview, and offer counts
  and recent activity from `GET /api/jobs` (`getDashboardData`), and the
  route owns its requests so the page stays free of MSW.
- **No test pins a timezone.** Local runs use the machine's zone, CI
  runs UTC.

## Decisions

### D1 - History comes from every page of `/api/timeline-events`, all or nothing

Chosen: a `getAllTimelineEvents()` service that reads page 0 with
`size=100`, then the remaining pages in parallel, and de-duplicates by
event id. A `useStatusHistory` hook loads it beside the jobs list. If
any page fails, the hook reports an error and **no** history: per the
task, partial history must not produce a number. The insights section
then shows an unavailable state with a retry; the job counts and recent
activity are unaffected, because they do not need history.

Oldest-first ordering makes the pages stable while new events are
appended, since new rows land on the last page. A job deleted mid-read
can shift rows between pages; de-duplication handles a repeat, and a
missed row for a deleted job does not matter because events for jobs not
in the job list are ignored (D2).

Rejected:

- **One `/jobs/{id}/timeline` request per job.** The task forbids a
  per-row history request.
- **A new summary endpoint.** The task rules out backend APIs here.
- **Computing from whatever pages loaded.** A partial read would
  undercount silently.

### D2 - The recorded application date is a job's first transition into APPLIED

For each job in the current job list, the application event is its
earliest event with `nextStatus === 'APPLIED'` (by `createdAt`, then
`id`). Later edits never move it, because edits write no event, and a
repeated `APPLIED` transition is ignored because only the first counts.

A job has an **unknown** application date when it has no such event and
its current status is anything other than `WISHLIST`. That covers jobs
saved straight into a later status and jobs that skipped `APPLIED`. A
`WISHLIST` job has not applied, so it is neither known nor unknown.
`createdAt` and `updatedAt` are never used as a substitute.

Events whose `jobId` is not in the job list (deleted jobs) are ignored.

### D3 - Applications this week: the browser's Monday-to-Monday week

The week starts at local midnight on the most recent Monday and ends at
local midnight seven calendar days later, built with
`new Date(year, month, day)` so a daylight-saving change inside the week
does not move either boundary. The count is the number of distinct jobs
whose application event falls in `[start, end)`. The card shows the date
range ("Sep 28 - Oct 4") and how many applications have unknown dates
and are therefore not counted.

### D4 - Interview rate: all recorded applications, with both counts shown

Cohort: every job with a recorded application date, all time. A job
counts as interviewed when it has any event with `nextStatus ===
'INTERVIEW'` at or after its application event. Its current status does
not matter, so a job now in `OFFER` or `REJECTED` still counts; a
direct `APPLIED -> OFFER` is not an interview. The card shows the rate
with "x of y applications". An empty cohort shows "Not enough data",
never 0%.

Rejected:

- **A rolling 30-day cohort.** Recent applications have had no time to
  reach an interview, which drags the rate down, and a personal tracker
  often has too few rows in a month to say anything.
- **A user-selectable cohort.** A control the task does not ask for.

### D5 - Aging applications: calendar days, oldest first, unknowns apart

For jobs currently in `APPLIED` with a known application date, the age
is the number of local calendar days between the application date and
today, computed from the two local dates (via `Date.UTC(y, m, d)`), not
by dividing milliseconds by 24 hours, which is off by one across a
daylight-saving change. The card lists the five oldest with their age,
and the count of `APPLIED` jobs whose date is unknown.

Rejected: a "stale after N days" threshold. The rules define age, not a
threshold, and any number picked here would be arbitrary.

### D6 - Response rate is shown as unavailable, with the reason

A fixed card states that response rate needs recorded employer
responses, which the tracker does not capture yet, and that a rejection
or withdrawal is not treated as one. No percentage, and visibly
different from 0%. A numeric rate is R-11's follow-up.

### D7 - Next actions reuse task 040's card

The "Next reminders" card already lists the next open reminders and
dated tasks across jobs, which is what "next actions" means here.
Adding a second list would show the same items twice. It stays behind
`REMINDERS_FEATURE_ENABLED`, so built images show no next actions until
040's backend lands; the dev server shows them with 040's mock.

Rejected: a separate next-actions list built from tasks alone. It
duplicates 040's merge of tasks and reminders and would disagree with it.

### D8 - Calculations are pure functions of jobs, events, and `now`

`getDashboardInsights(jobs, events, now)` returns plain values; the
component passes `new Date()`. Week and DST tests pin
`process.env.TZ = 'Europe/Berlin'` for their file and restore it after.
Verified on this machine: assigning `process.env.TZ` inside a Vitest
test changes `Date`'s local-time results immediately (probe deleted).

### D9 - One insights section of four compact cards

A new `DashboardInsights` component below the existing metrics: four
cards (applications this week, interview rate, aging applications,
response rate), each with a label, a value, and a detail line for the
period, counts, or explanation. `MetricCard` has no detail line, so the
section uses a small local card rather than changing a shared
component.

## Proposed Change

| File | Change |
| --- | --- |
| `services/timeline/timeline.types.ts` | `jobId` on `TTimelineEventResponse`; a paged response type |
| `services/timeline/timeline.service.ts` | `getAllTimelineEvents()` (D1) |
| `features/dashboard/dashboardInsights.utils.ts` | D2-D5 calculations, date helpers |
| `features/dashboard/useStatusHistory.ts` | loads all history (D1) |
| `features/dashboard/components/DashboardInsights.tsx` | the four cards (D9), loading and unavailable states |
| `pages/dashboard/DashboardPage.tsx`, `routes/modules/dashboardRoute.tsx` | pass history in, place the section |
| `i18n/locales/en.json`, `de.json` | insight labels and explanations |

## Tests

- `dashboardInsights.utils.test.ts`, the task's list:
  - empty jobs and events;
  - correct rate, counts, and ages;
  - a description edit (no event, newer `updatedAt`) does not reset age;
    repeated `APPLIED` counts once;
  - `OFFER`/`REJECTED` jobs with an interview event count; a direct
    `APPLIED -> OFFER` does not;
  - unknown dates, a zero denominator, Monday and Sunday-night week
    boundaries, and a week and an age spanning the March and October
    DST changes in Europe/Berlin.
- `timeline.service.test.ts`: page fan-out, de-duplication, a failing
  page rejects the whole read.
- `useStatusHistory.test.tsx`: loads, partial failure gives an error
  and no events, retry.
- `DashboardInsights.test.tsx`: values with their periods and counts,
  unavailable states, loading.
- Dashboard page and route tests: insights render, a history failure
  leaves the job metrics; next actions still render (040's card).

## Implementation Order

1. **Calculations and their tests first**, with fixed `now` and pinned
   TZ. Expected failure worth seeing: an age computed by millisecond
   division is a day off across the October DST change.
2. **Timeline service and hook**, with MSW. Expected failure: a single
   500 on page 2 must reject; returning pages 0-1 would pass a naive
   test.
3. **Component, page, route, translations.**
4. `npm run frontend:verify`, then `npm run verify`.
5. **Browser check** against the compose stack with a few status
   changes made through the UI.

## Verification Plan

The affected Vitest files, `npm run frontend:verify`, `npm run verify`,
and a manual look at the dashboard in both languages against a stack
whose jobs have had real status changes.

## Scope Boundaries

Out of scope: AI insights, charts or chart libraries, a numeric response
rate (R-11), historical date entry (R-11), backend endpoints or tables,
cohort selection, aging thresholds, and changing 040's card beyond
placing it.

## Completion Rules

Tick the task file's criteria once verified, update
`docs/backlog/phase-5-non-ai-workflows.md` and the recommended-next-task
line in `docs/backlog/README.md`, and mark this plan `Completed` with a
verified-state section.

## Acceptance Criteria

- [x] Applications this week, interview rate, aging applications, and
  an explained unavailable response rate render from recorded history.
- [x] Each metric shows its period or cohort and its counts; a zero
  denominator or missing history is unavailable, not 0.
- [x] Partial or failed history produces no numbers, and leaves the job
  metrics visible.
- [x] Next actions render through task 040's card.
- [x] The calculations are covered, including DST and week boundaries.

## Verified State

Built as planned. One addition: `TTimelineEventResponse` gained `jobId`,
which the API always sent but the frontend type omitted; the three
fixtures that build one were updated to match the real response.

- **Calculations.** `dashboardInsights.utils.test.ts`, 19 tests, runs in
  Europe/Berlin via `vi.stubEnv('TZ', ...)` and passes whether Vitest
  starts in the machine's zone or in UTC (as CI does). A mutation check
  replaced the calendar-day difference with millisecond division: four
  tests failed, including both DST ages, then passed again on restore.
- **History.** `getAllTimelineEvents` tests cover page fan-out, one
  request for empty history, de-duplication of a shifted row, and that a
  failing later page rejects the whole read; `useStatusHistory` returns
  no events after a partial failure and recovers on reload.
- **UI.** Component, page, and route tests cover the four cards, their
  counts and periods, "Not enough data" instead of 0%, loading and
  failed history with the job metrics still shown, and a route test
  from a served history page to a rendered "100%".
- **`npm run frontend:verify`**: 629 tests, lint, format, build.
  **`npm run backend:verify`** unchanged and green.
- **Browser**, against the compose stack rebuilt from this branch, with
  two jobs moved through the real API (WISHLIST -> APPLIED -> INTERVIEW,
  and WISHLIST -> APPLIED), on Sunday 4 October 2026: the week read
  "Sep 28 - Oct 4" with 2 applications and 2 jobs without a recorded
  date left out; interview rate "50%", "1 of 2 recorded applications";
  one job waiting, "0 days"; response rate "Unavailable" with its
  reason. The German page showed the same values with German labels and
  dates ("28. Sept. - 4. Okt."). The two jobs were deleted afterwards.

Next actions (D7) are task 040's card, which built images hide until
040's backend lands; this task did not change it.

