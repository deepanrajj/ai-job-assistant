# Task 042 - Add Calendar View Plan

Status: In progress

## Purpose

Put every dated thing in the tracker on one calendar: reminders
(follow-ups, interview prep, application deadlines), task due dates,
and the dates documents were submitted, each linking back to its job.
A month grid on wide screens and a date-grouped list everywhere, so it
works on a phone. No external sync, no recurrence, no timed events.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Utils, service, mock, page, route, flag | Done; `npm run frontend:verify` passed (725 tests) |
| Backend | `GET /api/calendar-items` (D1), after 040's and 041's backends | Not started (user-written) |
| API collection | `Calendar` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **Dev server with the mock** (`npm run dev:local`, port 5173, real
  jobs and tasks plus 040's and 041's mock reminders and documents),
  October 2026, checked with a one-off Playwright script and
  screenshots:
  - **Phone (375 px):** the date-grouped list only, no grid, and no
    horizontal scroll (page width 375). The first run wrapped the month
    heading and buttons onto two lines, so on phones the month buttons
    now show "‹" and "›" with their labels kept for screen readers;
    after that the header fits one line.
  - **Desktop (1280 px):** the Monday-first grid with today outlined,
    up to three items per day and "+3 more" on a crowded day, above the
    same list.
  - **German:** month, weekday names, dates, and labels translated
    ("Oktober 2026", "Mo".."So", "Verschickt · Anschreiben").
  - No request reached `/api/calendar-items`.
- **Built image** (compose, port 30080): Calendar shows "Coming soon"
  and makes no calendar request.

To see it: keep the compose stack up for PostgreSQL, run
`npm run dev:local`, and open `http://localhost:5173/calendar`.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/042-add-calendar-view.md`
- `docs/business/040-add-reminders-plan.md` (D7: "task 042 can add a
  range read when it knows its shape")
- `docs/business/041-add-application-documents-plan.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Reminder Delivery Is A Separate Follow-Up": date-only items stay
  calendar dates)

## Current State

Read on `main` at `4378716`.

- **Calendar** (`/calendar`) is a navigation entry rendering
  `ComingSoonPage`.
- **No cross-job read covers a date range.** Tasks are only readable
  per job (`/jobs/{id}/tasks`). `GET /api/reminders/next` returns at most
  20 open items, so it cannot fill a month. `GET /api/application-documents`
  lists every document but sits behind 041's unbuilt backend.
- **Reminders (040) and documents (041)** each have a frontend behind a
  feature flag and a dev-server mock; their backends are pending.
- **Shared helpers exist**: `getLocalIsoDate`, `useLocalToday`,
  `formatCalendarDate`, the reminder due states, and the type labels.
- **"Interviews"** in the task Goal have no date of their own yet:
  scheduled interview rounds are R-02. The closest dated items are
  `INTERVIEW_PREP` reminders.

## Decisions

### D1 - One cross-job range read: `GET /api/calendar-items?from=&to=`

Chosen: a new endpoint returning every dated item whose date falls in
`[from, to]` (inclusive, `YYYY-MM-DD`), across every job, as one plain
array ordered by date, then source, then id:

```text
source        REMINDER | TASK | DOCUMENT
id            reminder, task, or document id, by source
jobId         the job it belongs to
date          YYYY-MM-DD: due date, or submitted date for a document
title         reminder title, task title, or document version label
reminderType  ReminderType for REMINDER, else null
documentType  DocumentType for DOCUMENT, else null
isComplete    reminder completed, task DONE; always false for a document
```

`from` after `to`, a missing bound, or a span over 366 days is a 400;
the cap keeps one request bounded. The page asks for one month at a
time.

Approved by the user on 2026-10-05, over per-job requests and over
three separate range endpoints. This is the range read task 040's plan
deferred to this task. It is
backend work for the user, in the same queue as 040's and 041's, and
can only be built after them, since it reads their tables.

Rejected:

- **Per-job requests from the browser** (`/jobs/{id}/tasks`,
  `/reminders`, `/documents` for every job). One page view would cost
  three requests per job, the pattern 040 and 043 refused.
- **Widening `/reminders/next`.** It is a "what is next" list with a
  limit, not a date range, and would still miss documents.
- **Three range endpoints, one per source.** Three requests and a
  client-side merge for what one query can return in order.

### D2 - Completed items stay on the calendar, muted

A calendar answers "what happened on that day" as well as "what is
due", so completed reminders and done tasks stay, struck through and
muted, as in the Reminders tab. Documents are never "complete"; they
read "Submitted: <label>".

Rejected: hiding completed items, which would make past days look
empty.

### D3 - A month grid on wide screens, a date-grouped list always

The page shows one month, with previous, next, and "today" controls.

- **From `md` up**: a seven-column, Monday-first month grid. Each day
  lists up to three items (linking to their job) and "+n more"; today
  is outlined.
- **Always**, and alone on small screens: the same month as a list,
  one section per date that has items, each item showing its source
  label, title, the job's company, and a link to the job. A month with
  no items shows an empty state.

The list is the accessible, mobile-first view; the grid is a visual
summary of the same data, hidden from assistive technology
(`aria-hidden`) so screen readers do not hear every item twice.

Rejected: a grid only (unusable at 360 px wide) and a list only (the
task asks for a calendar-oriented view).

### D4 - Dates stay calendar dates

Every date is `YYYY-MM-DD` and is never turned into a moment: no
midnight UTC, no timezone conversion, per the product rule. Month
boundaries and "today" come from the browser's local date
(`getLocalIsoDate`, `useLocalToday`). Week rows start on Monday, as
task 043's week does.

### D5 - Frontend first, behind a flag, with a dev-only mock

As for 040 and 041: `CALENDAR_FEATURE_ENABLED` is false in built images,
which keep Calendar on "coming soon"; a mock of the endpoint runs only
in the Vite dev server. The mock builds items from the real jobs and
tasks plus 040's and 041's mock reminders and documents, so it reads
each job separately; that is acceptable only because it is a dev-only
stand-in.

### D6 - Interviews come from interview-prep reminders until R-02

The calendar shows no separate "interview" item: there is no interview
date in the data. `INTERVIEW_PREP` reminders are labelled as such.
Scheduled interview rounds (R-02) can add a fourth source later
without changing the page's shape.

## Proposed Change

### Frontend (this change)

| File | Change |
| --- | --- |
| `services/calendar/*` | types, `getCalendarItems(from, to)`, dev-only mock |
| `features/calendar/calendar.utils.ts` | month range, Monday-first grid, grouping by date |
| `features/calendar/calendar.constants.ts` | `CALENDAR_FEATURE_ENABLED` |
| `features/calendar/useCalendarItems.ts` | loads one month |
| `pages/calendar/CalendarPage.tsx`, components | grid, list, navigation, states |
| `routes/modules/calendarRoute.tsx` | the page or "coming soon" by flag |
| `i18n/locales/en.json`, `de.json` | labels |

### Backend (user-written, after 040 and 041)

A `calendar` package: a controller for `GET /calendar-items`, a service
that queries reminders, dated tasks, and submitted documents by date
range (one derived query per repository), merges and orders them, and
validates the range; DTOs; tests; and a Postman `Calendar` folder.

## Tests

- Utils: month range and grid for months starting on each weekday, a
  leap February, and the DST months; grouping by date in order.
- Page: items grouped by date with links to the right job; completed
  items muted; source labels; empty month; loading and error with
  retry; month navigation requests the new range; today marked.
- Hook, service, mock, route (flag on and off).

## Implementation Order

1. Utils and their tests (the grid maths is where mistakes hide).
2. Service, mock, hook.
3. Page and components, route, translations.
4. `npm run frontend:verify`; dev server with the mock at phone and
   desktop widths; the built image keeps "coming soon".

## Verification Plan

The affected Vitest files, `npm run frontend:verify`, the dev server in
both languages at 375 px and desktop width, and the compose image with
the feature hidden.

## Scope Boundaries

Out of scope: calendar export or sync (R-09), recurring events, timed
or timezone-aware events, interview rounds (R-02), creating or editing
items from the calendar (they are edited on job detail), a week or day
view, and the backend endpoint's implementation in this change.

## Completion Rules

The frontend can merge behind the flag. The task completes once the
endpoint exists and the mock and flag are removed; then tick the task
file, update `docs/backlog/phase-5-non-ai-workflows.md`, the
recommended-next-task line, `docs/context.md`'s API list, and mark this
plan `Completed`.

## Acceptance Criteria

- [ ] `/calendar` shows reminders, dated tasks, and submitted documents
  for a month, grouped by date, each linking to its job.
- [ ] It is usable at phone width (list) and shows a month grid on
  wider screens.
- [ ] Empty, loading, and error states render.
- [ ] Dates are never converted to moments.
- [ ] The endpoint exists, and the mock and flag are removed.
