# Task 089 - Refresh Calendar Page Plan

Status: Completed

## Purpose

Bring the Calendar page into the visual system set by tasks 084 to 088:
the month grid takes most of the width, with the selected day's items
beside it, using only the date-only items the app already loads.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md` (§3, including "Button variants")
- `docs/context.md`
- `tasks/roadmap/089-refresh-calendar-page.md`
- `docs/business/084-frontend-visual-refresh-plan.md`
- `docs/mockups/smart-job-tracker.html` (`calendar()`), visual only

## Current State

Read on `feat/task-089-refresh-calendar-page` at `afa062c` (tasks 084
to 088 merged).

- `calendarRoute` loads one month of `GET /api/calendar-items` and the
  jobs list, and shows "coming soon" while `CALENDAR_FEATURE_ENABLED`
  is off (production builds). The dev server serves mock items.
- `CalendarPage` is one `Card` titled with the month, with ghost
  "‹ Previous month", "Today", and "Next month ›" buttons. Below the
  header, from `md` up, a Monday-first month grid shows each day's
  items as plain primary-coloured text, up to three and "+n more", with
  today ringed. The grid is `aria-hidden`; every screen also gets the
  month as a list grouped by date, which is the accessible view: an
  `h3` per date ("Mon, Oct 5, 2026 · Today") over linked items named
  "{kind}: {title}, {company}".
- An item has a `source` (`REMINDER`, `TASK`, `DOCUMENT`), a `date`
  (`YYYY-MM-DD`, never a moment), a title, and `isComplete`. There is
  no time of day.
- The month buttons hide their words below `sm` with
  `sr-only sm:not-sr-only`. Task 088 found that `not-sr-only` resets
  `white-space` (measured in the dev app: the label wrapped), and that
  the pattern is fragile in general.

## Decisions

### D1 - Map the mock to real data

The prototype's month grid, coloured event chips, and today circle
carry over. Changed or left out:

- **"Upcoming" becomes the selected day** (D2).
- **No times.** The prototype's "Rivermind · 10:00 AM" has no source;
  items are date-only. Each row shows the kind and the company instead.
- **Weeks start on Monday**, as now, not on Sunday as in the prototype:
  it is the norm in Germany and the current grid's tested behaviour.
- **No week view**, which the task rules out.

### D2 - A selected-day panel instead of the month list

Owner decision, 2026-10-16, after reviewing a first version that kept
the full month as a dated list: on a busy month that list ran far below
the grid. Every day of the month is now a button; choosing one lists
that day's items, and only those, in a day panel. The task file was
updated to match: every loaded item stays reachable, through its day.

- A month opens on today when it is in the month, otherwise on its
  first day with items, otherwise on its first day
  (`getDefaultSelectedDate`). Changing the month drops a day chosen in
  the previous month, so paging back to a month opens it on its default
  day again; a day chosen for the incoming month is kept, which is how
  "Today" selects today from another month (second review). Keying the
  choice by its month alone was rejected: paging away and back would
  bring the old choice back.
- The shown day and its count are repeated in a polite live region, as
  below `xl` the panel is under the grid and often off screen. The
  region sits outside the panel and stays mounted, empty while loading,
  so a month's default day is announced too. The panel's list is named
  by the panel heading rather than a second label.
- `useCalendarItems` tags loaded items with their range and reports
  loading while they belong to another one. Its request starts in an
  effect, so without that the first render after a month change showed
  the old month's items under the new month (second review).
- The panel's title is the day ("Monday, October 5"), its subtitle
  "Today · 2 items" or the count. An empty day says "Nothing on ...";
  an empty month keeps "Nothing dated in {month}".
- Days of the neighbouring months are plain, muted cells, not buttons:
  their items are not loaded.

Rejected: putting everything in the grid alone (a day shows three
chips, so "+n more" items would be unreachable, and chips do not fit at
phone width); the next seven days plus a "show whole month" toggle
(simpler, but no way to look at one day of another month); a popover
per day (its own focus management, and still the grid's three-chip
limit for scanning).

### D3 - Layout

A month card (title, month buttons, colour key, grid) and the day
panel, as `minmax(0,2fr) minmax(20rem,1fr)` from `xl` up, stacked
below; the panel sits under the grid so a tap on a day shows its items
right below. From `md` a day cell is at least 6rem high with up to
three chips and "+n more"; below `md` a cell is 3rem with one dot per
kind on the day, so the grid fits a phone (about 43 px days at 390 px)
and stays the way to pick a day there. The first version hid the grid
on phones; with the panel it has to stay.

Loading and error replace the body of the month card, with no panel,
so the state shows once. The page keeps one root and one month card in
every state, so the month buttons are not remounted while the next
month loads and keep keyboard focus (code review). The date formatters
are created once per language, not per day.

### D4 - One colour per kind, everywhere, and words as well

Each kind keeps one hue across the page: reminders lavender (primary),
tasks peach (orange), submitted documents mint (success). The grid
chips and the panel's kind label take the tile tint
(`CALENDAR_SOURCE_TONES`); the phone dots and the colour key above the
grid take the solid dot (`CALENDAR_SOURCE_DOTS`), in one fixed order
(`CALENDAR_SOURCES`). A completed item is muted and struck through
whatever its kind. Colour is never the only signal: the chips are
`aria-hidden`, every day button is named "{weekday, date}, {n items}"
(and "· Today"), and every panel row names its kind in words. Rejected:
colour by reminder type (four reminder types plus tasks and documents,
too many tones to learn).

Today's number sits in a filled primary circle; the selected day has a
primary ring and tint and `aria-current="true"`, so the two never rely
on the same mark. `aria-pressed` was rejected in review: it promises a
toggle, and choosing the selected day again does not unselect it. The
keyboard focus mark is a dark outline inset inside the cell, so a
focused selected day stays distinct from its selection ring.

Left for task 092: one tab stop per day (31 in a long month). A single
tab stop with arrow keys (a roving `tabindex` grid) is the usual
pattern, but it is a larger change than this restyle.

### D5 - Month buttons

"Previous month" and "Next month" become icon buttons with that name as
`aria-label`, and "Today" keeps its word, all `secondary`, as paging is
in `frontend/AGENTS.md`. New `ChevronLeftIcon` and `ChevronRightIcon`,
in the existing icon pattern. This drops the `sr-only sm:not-sr-only`
labels (see Current State). Rejected: keeping the `‹`/`›` glyphs, which
render differently per font.

### D6 - Focused checks

Calendar page and route tests, the new icons, lint, format, and
`tsc -b`; the full suite and E2E are left to CI. The task file's
`npm run frontend:verify` step is superseded by that rule.

## Proposed Change

- `components/icons/ChevronLeftIcon.tsx`, `ChevronRightIcon.tsx`, tests,
  and the barrel.
- `features/calendar/calendar.constants.ts`: tint, dot, and order per
  source.
- `features/calendar/calendar.utils.ts`: `getDefaultSelectedDate`.
- `features/calendar/useCalendarItems.ts`: loading until the items
  belong to the requested range, with a new hook test.
- `pages/calendar/CalendarPage.tsx`: month card with colour key and day
  buttons, day panel, month buttons.
- Strings in both languages for the day panel, day button names, item
  counts, and the colour key; `calendar.listLabel` is removed.

## Tests

- Month navigation by button name, and event links with their names.
- Day buttons: one per day of the month, named by date and count, the
  selected one pressed; choosing a day lists only its items; an empty
  day and an empty month; the default day; paging drops a chosen day;
  "Today" selects today.
- One tint per kind in chip and panel; the colour key's order; phone
  dots per kind; a completed item muted.
- Chips stay out of the accessibility tree; "+n more" items are listed
  in the panel.
- Loading, error, and the route's coming-soon variant unchanged; the
  route test now finds the current month's item by its day button.

## Implementation Order

1. Icons and their tests.
2. `getDefaultSelectedDate` and its tests.
3. The page; expect the route test that looked for every item of the
   month as a link to fail, since only the selected day is listed.
4. Strings, focused checks, and a visual check in the dev server at
   1536, 1280, 768, and 390 px, in both languages.

## Verification Plan

Focused Vitest files for the changed and affected code, ESLint,
Prettier, and `tsc -b`, then the visual check above. Full suite and E2E
in CI.

## Scope Boundaries

- No API, date model, storage, or feature-flag changes.
- No week view, export, sync, or notifications.

## Completion Rules

Mark this plan and the task Completed after the focused checks pass,
and update the phase backlog.

## Acceptance Criteria

- [x] Calendar follows the approved month-grid composition.
- [x] Dates and event types are accurate and readable.
- [x] Existing navigation and failure states still work.
- [x] Flagged and narrow-screen variants remain accessible.
- [x] Focused tests pass.

## Verified State

- Month card: title, `secondary` icon buttons for the previous and next
  month and "Today", the colour key, and a Monday-first grid of day
  buttons with tinted chips (dots on phones), today a filled circle,
  the selected day ringed. Day panel beside it from `xl`, below it
  under `xl`, listing the selected day's items with the kind label in
  the same tint and the company.
- Focused checks: Calendar page, route, feature, and service tests, the
  icons, and the routes (31 files, 98 tests), ESLint, Prettier, and
  `tsc -b` passed. The full suite and E2E are left to CI.
- Checked in the dev server with the calendar mock: 1536 px opens on
  today (12 items) and choosing 13 October lists its 24 items; 390 px
  shows the grid with dots and the panel under it; 768 and 1280 px
  stack and sit side by side respectively; German strings checked. No
  horizontal overflow at any of those widths.
