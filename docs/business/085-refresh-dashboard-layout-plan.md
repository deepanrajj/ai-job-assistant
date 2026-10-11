# Task 085 - Refresh Dashboard Layout Plan

Status: Completed

## Purpose

Rearrange the real dashboard into the approved overview: insights first,
the pipeline and dated next steps in the middle, recent jobs below. The
page keeps its real data, its explanations, and its independent loading
and failure states.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/085-refresh-dashboard-layout.md`
- `docs/business/084-frontend-visual-refresh-plan.md` (D4, D5)
- `docs/mockups/smart-job-tracker.html` (`dashboard()`), visual only

## Current State

Read on `feat/task-085-refresh-dashboard-layout` at `4b57f56` (task 084
merged).

- `DashboardPage` renders, top to bottom: `DashboardMetrics` (total,
  active, interviews, offers), `DashboardInsights` (applications this
  week, interview rate, aging applications, unavailable response rate),
  `DashboardNextReminders` when the reminders flag is on, then
  `DashboardStatusOverview` beside `DashboardRecentActivity`.
- Jobs, status history, and next reminders load independently. A jobs
  failure replaces the page; history and reminder failures stay inside
  their own card with a retry.
- `useNextReminders` asks `GET /api/reminders/next` for the
  `NEXT_REMINDERS_LIMIT` (5) earliest open reminders, overdue included.
  Every reminder has a `YYYY-MM-DD` `dueDate`.
- `getLocalWeek` in `dashboardInsights.utils.ts` already defines the
  Monday-to-Monday local week the insights use.
- Recent activity lists the four most recently updated jobs as plain
  text, with no links.
- The prototype shows three insight tiles, a coloured pipeline beside a
  seven-day "This week" grid, and a recent applications table with a
  "View all" link.

## Decisions

### D1 - Insights first, then pipeline and reminders, then recent jobs

The insights section moves to the top and keeps all four cards. The
middle row puts the pipeline beside the reminders. Recent jobs span the
full width below. When the reminders feature is off there is no
reminders card, so the pipeline and recent jobs share the middle row
instead and the page has no empty column.

Rejected:

- **The prototype's three tiles.** It drops aging applications and the
  response-rate explanation, which the task requires to stay visible.
- **Keeping the current order.** Puts four raw counts above the
  insights, the reverse of the approved hierarchy.

### D2 - Job counts move into the pipeline card

The four `DashboardMetrics` counts repeat the pipeline: interviews and
offers are pipeline rows, and total and active fit the pipeline card's
subtitle ("3 jobs · 3 active"). `DashboardMetrics` and its test are
removed, and `DashboardStatusOverview` becomes the pipeline card. The
counts still come from `getDashboardData`, unchanged, and still show
while history or reminders load or fail.

Rejected:

- **A second row of metric cards.** Eight cards above the fold, half of
  them duplicating the pipeline.

### D3 - A weekly agenda, not a seven-day grid

The reminders card groups the loaded reminders by day: an "Overdue"
group, one group per day of the current week that has reminders (today
labelled as such), and a "Later" group. Each reminder keeps its link to
its job and its due badge. Empty days are not shown.

The card has only the five earliest open reminders, so it cannot know
that a day without one is free. A seven-day grid would print "No plans"
on days that may have reminders beyond the fifth. When exactly
more reminders exist than it shows, the card says it shows the next five,
so a partial list is not read as the whole week. To know that, the
dashboard asks for `NEXT_REMINDERS_LIMIT + 1` and shows five: the sixth
arriving is the only signal that more exist. The endpoint already takes
the limit, so this changes the requested number, not the API.

Rejected:

- **The prototype's seven-column grid.** Claims empty days it cannot
  verify, is cramped at two-thirds width, and needs horizontal scrolling
  on phones.
- **Raising the limit.** Still not complete for a busy week, and changes
  the request rather than the presentation.
- **Week navigation.** Needs reminders for other weeks, which the
  dashboard does not load. The calendar page owns that.

### D4 - Recent jobs link to their detail pages

Each recent job becomes a link to its detail page and shows its status
pill, using the shared `statusPillClasses` from the jobs feature, so a
status looks the same on every page. The card header gets a "View all"
link to the jobs list. The heading stays "Recent activity": the list is
recently updated jobs of every status, not only applications.

### D5 - Tinted insight cards with icon tiles, coloured pipeline bars

Insight cards take a tone: lavender (`primary-50`) for applications,
mint for the interview rate, peach for aging, and a soft blue for the
response rate. Each card has an icon tile beside its label, from a new
`dashboard.icons.tsx`. The value sits below at the card's full width:
four cards to a row at 1280 px with the sidebar open leave too little
room beside an icon, and German "Nicht verfügbar" wrapped. The
unavailable response rate prints its value smaller and greyed, so it
still reads as an explanation rather than a result.

Pipeline rows get a status dot and bar colour from one new constant map,
using the solid shade of each status pill's colour family, so a status
looks the same in the pipeline and in its pill. That map,
`statusSolidClasses`, sits beside `statusPillClasses` in the jobs
feature so the two cannot drift apart unnoticed. `warning-500` and
`danger-500` are added to the theme for this. The interview-rate card
reuses a shared `CalendarIcon`, moved from the app shell to
`components/icons`.
The bars sit under each label, so German status names are never cut
short. The bars stay supplementary: each row prints its count, and the
meters keep their accessible names and values.

### D6 - A week-over-week trend from recorded history

"Applications this week" shows how it compares with the week before
("1 more than last week"), as the reference image does. Both counts use
recorded APPLIED transitions, and last week is counted only from its
Monday through today's weekday, in whole local days. A week in progress
is compared with the same span of last week, so Monday morning does not
read as a drop against a full week. The figures refresh only at
midnight, so both spans include the whole current weekday, and the
sentence says exactly that: "1 more than by this day last week". With no
application in either span there is nothing to compare, so the trend is
left out. The trend is a sentence with a decorative
arrow, so colour and arrow are never the only signal.

Rejected:

- **Trends on the other cards.** The interview rate and aging have no
  agreed previous-period definition yet, and an invented one would look
  as authoritative as the real counts.
- **Sparklines.** Need a per-day series the dashboard does not compute.

### D7 - Recent activity as a table on desktop

From `md` up, recent activity is a table with company (linking to the
job), role, applied date, status, and updated date, chosen with
`useBreakpoint('md')` as `DataTable` does, so only one layout is in the
DOM. Phones keep the linked cards. The applied date is the recorded
APPLIED transition from `getRecordedApplications`, and only from a
settled, error-free history. Otherwise the cell shows a dash whose
screen-reader text says why: "Not applied" for a wishlist job or one
withdrawn straight from the wishlist, "Not available" while the history
loads or after it fails, and "Not recorded" when it holds no application
for the job. Only the recent jobs' events are read.

The table needs about 640 px. Recent activity measures its own width
with a new `useElementWidth` hook, first before paint so the layout never
flashes, then with a `ResizeObserver`, and uses the cards when narrower, such as in half of the middle row when reminders
are off, the production default. The cards then show the applied date
too, or the same reason as the table when there is none. Where the
width cannot be measured, the `md` breakpoint decides.
The page derives the application history once, with a new
`getApplicationHistory`, and passes it to both the insights and recent
activity. Dates from another year include the year. Rows are not links as a whole, so
they have no hover highlight; the company name is the link.

Rejected:

- **The reference image's "Next step" column.** The dashboard has only
  the next five reminders, so most rows would be blank or wrong.
- **Both layouts in the DOM, hidden by CSS.** Doubles every link for
  tests and for anyone with styles off.

## Proposed Change

- `pages/dashboard/DashboardPage.tsx`: new order and grid (D1); drop
  `DashboardMetrics`.
- `features/dashboard/components/DashboardInsights.tsx`: card tones,
  icon tiles, and the weekly trend (D5, D6).
- `features/dashboard/dashboardInsights.utils.ts`: `previousWeekCount`.
- `features/dashboard/dashboard.icons.tsx`: the four insight icons.
- `features/dashboard/components/DashboardStatusOverview.tsx`: pipeline
  card with counts subtitle, coloured rows, and a "View all" link.
- `features/dashboard/components/DashboardNextReminders.tsx`: grouping
  and the limit note, with a new pure `groupRemindersByWeek` utility in
  `dashboard.utils.ts`.
- `features/dashboard/components/DashboardRecentActivity.tsx`: links,
  status pills, "View all", and the desktop table (D7).
- `features/dashboard/dashboard.constants.ts`: pipeline colours.
- Remove `DashboardMetrics.tsx` and its test.
- `en` and `de` strings for new labels.

## Tests

- `groupRemindersByWeek`: overdue, today, other days, later, and the
  week boundary.
- Reminders card: groups render in order with job links; the limit note
  appears only at the limit; loading, error with retry, and empty keep
  working; the rest of the page stays when the card errors.
- Pipeline: counts subtitle, meters, and the "View all" link.
- Recent activity: rows link to job detail in updated order, with status.
- Page: insights render before the pipeline; without reminders the
  pipeline and recent activity share a row; jobs loading, jobs error,
  and history error still behave as before.

## Implementation Order

1. `groupRemindersByWeek` with its tests, since the card depends on it.
2. Reminders card, then pipeline, recent activity, and insight tones.
3. Page composition and removal of `DashboardMetrics`. Expect the page
   tests that read the metric cards to fail here and be rewritten
   against the pipeline subtitle.
4. Translations, then `npm run frontend:verify` and a visual check.

## Verification Plan

Focused dashboard Vitest files while iterating, then
`npm run frontend:verify`. Check populated, empty, and error states in
the dev server at desktop and phone widths.

## Scope Boundaries

- No API or flag change; `NEXT_REMINDERS_LIMIT` stays 5, and the
  reminders request asks for one more to detect a longer list (D3).
- No new status stages, no prototype counts or companies.
- The page heading and other pages are untouched.

## Completion Rules

Tick the task's criteria only after verification passes, and update the
phase backlog's next-task line.

## Acceptance Criteria

- [x] Insights, pipeline with reminders, and recent jobs appear in that
  order using real data.
- [x] The response-rate explanation stays visible.
- [x] Reminders, history, and jobs keep independent loading and errors.
- [x] Desktop and phone layouts are readable and keyboard accessible.
- [x] `npm run frontend:verify` passes.

## Verified State

- The page renders insights, then the pipeline beside the reminders
  agenda, then recent activity; with reminders off, the pipeline and
  recent activity share the middle row.
- `groupRemindersByWeek` and `formatAgendaDay` are new in
  `dashboard.utils.ts`; `DashboardViewAllLink` is shared by the pipeline
  and recent activity cards; recent jobs reuse the jobs feature's
  `StatusPill`.
- `DashboardMetrics`, its test, and its five strings are removed. The
  shared `MetricCard` stays, as later page tasks may use it.
- Pipeline bars sit under each status label, after the 320 px check
  showed German labels truncated beside them.
- The insight cards have icon tiles and a soft blue response-rate card;
  applications this week compares with last week; recent activity is a
  table from `md` up with recorded applied dates.
- `npm run frontend:verify`: 966 tests in 179 files, lint, format check,
  coverage, and build passed. Checked in the running app at 320 px in
  German and at 1280 px in English, the latter in a 1280 px iframe.
