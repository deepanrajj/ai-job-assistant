# Task 086 - Refresh Jobs List And Board Plan

Status: Completed

## Purpose

Bring both Jobs views, the table and the status board, into the visual
system set by tasks 084 and 085, without changing what they search,
filter, sort, or link to.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/086-refresh-jobs-list-and-board.md`
- `docs/business/084-frontend-visual-refresh-plan.md` (D4, D5)
- `docs/business/085-refresh-dashboard-layout-plan.md` (status colours)
- `docs/mockups/smart-job-tracker.html` (`jobsPage()`), visual only

## Current State

Read on `feat/task-086-refresh-jobs-list-and-board` at `64122fd`
(tasks 084 and 085 merged).

- `JobsPage` renders the shared `DataTable` with the search, status
  filter, sortable columns, pagination, and a Table/Pipeline switch in
  its header. The Pipeline view renders `JobsKanbanBoard` instead.
- `DataTable` is used only by `JobsPage`. It draws a plain bordered box
  with a grey toolbar, a semantic table from `md` up, and on phones one
  card per row listing every column as label and value.
- The board shows every saved job in six status columns; search and the
  status filter apply to the table only. Kanban cards print
  "Location - Salary", with "Not set" for either when missing.
- The switch is two `Button`s with `aria-pressed`, solid primary when
  selected.
- Add Job lives in the header from `sm` up, in the menu drawer on
  phones, and in the first-run empty state on phones (tasks 084, 085).

## Decisions

### D1 - Restyle `DataTable` in place

`DataTable` and its parts take the card look shared by the dashboard:
rounded corners, the soft shadow, uppercase tracked column headings, and
roomier rows. Search, filters, and sorting sit in their own toolbar card
above it, and the title, result summary, and view switch sit inside the
table card, as in the owner's reference image. It has one consumer, so
nothing else changes appearance.

Rejected:

- **A Jobs-only table.** The task rules out replacing the reusable
  `DataTable` to match the mock.

### D2 - A segmented view switch

Table/Pipeline becomes one rounded group with a white, shadowed segment
for the selected view, like the language switch: a light selected state,
so the switch does not compete with Add Job, the page's primary action.
It keeps `role="group"`, its label, and `aria-pressed` on each button.

### D3 - The board ignores the status filter

The board started out ignoring search and the status filter, as it did
before this task; D11 later gives it search and sort.
The task forbids changing what the views filter, and a status filter on
a board grouped by status would empty five of its six columns. Columns
gain the status colour dot from `statusSolidClasses` and a count badge,
and each column keeps its region name.

### D4 - Kanban cards print only what is set

A card shows company, role, then location and salary joined by "·",
leaving out either when it is not set and the line when both are. "Not
set - Not set" told the user nothing. The card also shows its last
update, as the table does, so the two views carry the same facts.

### D5 - Phone rows lead with the job

On phones each row keeps every column, but company and role head the
card and the status pill sits beside them, before the remaining fields.
This uses the existing `mobileCell` and column order, so no column is
dropped and the table's columns stay the source of truth.

Rejected:

- **Hiding columns on phones.** Location, salary, and update date would
  become unreachable on the device where the list is most used.

### D6 - Status count cards above the toolbar

At the owner's request, after first leaving them out, the page shows a
row of count cards above the toolbar, in both views: total jobs, then
Applied, Interview, Offer, and Rejected, each topped with its status
colour. Wishlist and Withdrawn count in the total only, to keep the row
at five. The counts cover every saved job, not the current search or
filter, so they stay put while the list narrows; the result summary
still reports the filtered list. A first-run user with no jobs sees no
cards.

Rejected:

- **The reference's "Waiting for a reply" and "Next steps" cards.** The
  first is not a status; the second needs reminders this page does not
  load.

### D7 - A "Sort by" select beside the filters

`DataTable` gains an opt-in `showSortSelect`: a select offering both
directions of every sortable column plus "Default order", wired to the
same sort state as the column headers, so either control reflects the
other. It adds no sort the headers could not already set.

### D8 - A "Date applied" column from status history

The table gains a sortable "Date applied" column: the job's first
recorded APPLIED transition, from the status history the dashboard
already loads (`useStatusHistory`), now also requested by the Jobs
route. It is shown only from a settled, error-free history. A missing
date shows a dash that tells screen readers why ("Not applied",
"Not recorded", "Not available"), using one shared
`getMissingApplicationReason` that the dashboard now uses too. The
history is a separate request, so it never holds up or replaces the
list. It loads once per visit; if it fails, the table shows a notice
with "Try again". A board move does not reload it: each saved move is
recorded as a status-change event (`savedMoveEvents`) and merged into
the loaded history, and the history is read against the jobs as shown,
moves included. So a move to Applied is dated at once, a move from the
wishlist to Withdrawn reads "Not applied", and moving never blanks the
dates, reorders a date sort, or downloads the whole history again. A
history loaded after some moves already holds them, so only moves saved
since it arrived are merged, and none counts twice. Its failure notice
is a plain notice, not a live region, since it holds a button. Blank
values, such as jobs with no application date, sort last in both
directions.

### D9 - Move a job to another status from its board card

At the owner's request, each board card's status pill is a control:
pressing it reveals the other five statuses as buttons underneath. The
owner chose this over a separate "Move to status" button (the first
version), a native status select, and previous/next arrows, since the
pill keeps the current status visible and takes no extra space.

- **Pattern.** A disclosure of plain buttons, not an ARIA menu, so mouse,
  touch, keyboard (Tab, Enter, Space), and screen readers all use it the
  same way, with no library. Opening it focuses the first status; Escape
  closes it and returns focus to the pill; a press outside closes it.
  The pill's name starts with its visible status ("Interview, change
  status for Celonis"). The list sits in the card's flow, so the board's
  scroll container cannot clip it.
- **Request.** The existing `PUT /api/jobs/{id}` with the job's other
  fields unchanged, the same full replacement job detail's status change
  sends. A new `useMoveJobStatus` calls `updateJob` per move rather than
  through `useUpdateJob`, whose single shared request discards an older
  response when a newer one starts, which would lose a quick second move
  of another job. Moves of one job are queued, each sent once the
  previous one settles, so the server applies them in order; moves of
  different jobs run side by side.
- **Feedback.** The card moves at once and takes the saved job from the
  response; a failure puts it back and shows an alert naming the job and
  status. Each move is announced in a status region, and focus follows
  the card to its status pill in the new column. Moves apply to the
  table and counts too. A reload drops them, and a move still in flight
  then is ignored when it settles, so it cannot overwrite fresher data.
  A failed move restores the job as last saved. Every failure is
  reported, including an earlier queued move that a later one replaced.
  The failure alert has a Dismiss button and clears when the next move
  starts or the view changes.
- **References.** The pill points at its list with `aria-controls` only
  while the list exists.
- **Edge cases.** Tabbing out of an open list closes it. A failure that
  arrives late only takes focus back if focus was lost when the card
  returned, never from wherever the user has moved on to. A queued move
  is recorded from the job's last saved status. Choosing the view already
  shown does not clear a failure alert.

Rejected:

- **Drag and drop.** Needs a library or a large amount of pointer and
  keyboard code to be accessible, and the task asked for neither.
- **A floating menu.** The board scrolls sideways, which would clip it.

### D10 - The board scrolls inside its card, not the page

Switching to the board made the whole page scroll sideways (and so
scroll vertically at a different height). Each column's count badge has
screen-reader-only text, which is absolutely positioned; with no
positioned ancestor it escaped the board's scroll box, and the last
columns' text sat about 2000 px across, stretching the page. The board's
scroll row is now `relative`, which contains it: measured in the running
app, the page is exactly as wide as the window and only the board
scrolls sideways.

### D11 - Search and sort apply to the board too

At the owner's request, the board shows the search and "Sort by"
controls, and both views share one search and one sort, lifted into
`JobsPage` (`DataTable` gains optional controlled `searchQuery` and
`sortState`). Cards that do not match the search are hidden in each
column, an emptied column says "No matching jobs in this status", and
the summary reports how many are shown, using the table's own
`filterDataTableRows`, so the two views cannot match differently. The
sort orders cards within each column. "Status" stays on offer there:
it changes nothing inside a status column, but leaving it out let a
status sort chosen in the table show as "Default order" on the board,
where it could not be cleared. The status filter stays table-only: on a board
grouped by status it would only empty the other columns.

### D12 - Application history is its own shared module

Recorded applications, wishlist withdrawals, the missing-date reasons
and their one set of strings (`statusHistory.*`), and
`useStatusHistory` move from the dashboard feature to
`features/statusHistory`. The dashboard and the jobs page both import
it, so neither reaches into the other, and the missing-date wording
exists once per language.

## Proposed Change

- `components/dataTable/DataTable.tsx` and `parts/*`: card styling (D1)
  and phone rows (D5).
- `features/jobs/jobs.config.tsx`: segmented switch (D2) and the phone
  heading cell.
- `features/jobs/components/JobsKanbanBoard.tsx` and
  `JobsKanbanCard.tsx`: column dots and badges (D3), card facts (D4),
  the move control (D9), the page overflow (D10), and filtering (D11).
- `features/jobs/components/JobsSummaryCards.tsx` (D6),
  `JobStatusMenu.tsx` and `useMoveJobStatus.ts` (D9).
- `routes/modules/jobsRoute.tsx`: loads status history (D8).

## Tests

- The switch keeps its group name and `aria-pressed`, and both views
  keep the same jobs and links.
- Search, status filter, and sorting keep their existing tests.
- Kanban cards leave out unset fields and show the update date.
- Phone rows still show every column.

## Implementation Order

1. `DataTable` styling, then the phone rows; existing DataTable and
   Jobs tests should pass unchanged, since they query by role and text.
2. The view switch.
3. Kanban columns and cards; expect the "Not set - Not set" test to
   fail and be rewritten for D4.
4. Translations, `npm run frontend:verify`, and a visual check.

## Verification Plan

Focused Jobs, DataTable, and Kanban Vitest files, then
`npm run frontend:verify`. Check both views at desktop and phone widths
in the running app.

## Scope Boundaries

- No new search fields, filters, statuses, sort options, or job fields.
- No API or persistence change.
- Job detail and forms belong to task 091.

## Completion Rules

Tick the task's criteria only after verification passes, and update the
phase backlog's next-task line.

## Acceptance Criteria

- [x] Table and board use the shared card styling and status colours.
- [x] Search, filter, sorting, status columns, and links behave as
  before.
- [x] Loading, error, empty, and no-match states remain useful.
- [x] Desktop and phone layouts are accessible.
- [x] `npm run frontend:verify` passes.

## Verified State

- Both views: count cards first, then the toolbar card (search, status,
  sort) and one card with the title, summary, switch, and the table or
  board. Search and sort are shared by both views; the status filter is
  table-only.
- The table adds a sortable "Date applied" column; phone cards lead with
  company, role, and status.
- Board cards move a job to another status from their status pill, a
  keyboard- and screen-reader-friendly disclosure, optimistically, with an
  announcement, focus that follows the card, and an alert on failure.
- PR review fixes: moves of one job are queued and a reload drops
  in-flight results; saved moves are merged into the loaded history
  rather than reloading it, and a failed history load offers a retry;
  every move failure is reported and its alert can be dismissed; the board offers the status sort; both views share one
  search filter; the history helpers live in `features/statusHistory`.
- `npm run frontend:verify` passed 998 tests in 184 files, lint, format
  check, coverage, and build. The page overflow fix was measured in the
  running app at 1536 px, and the status pill at 768 px in German.
