# Task 088 - Refresh Applications Page Plan

Status: Completed

## Purpose

Bring the Applications page, the overview of what was sent with each
application, into the visual system set by tasks 084 to 087, using only
the document metadata the app stores.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/088-refresh-applications-page.md`
- `docs/business/084-frontend-visual-refresh-plan.md` (D1, D4, D5)
- `docs/mockups/smart-job-tracker.html` (`applications()`), visual only

## Current State

Read on `feat/task-088-refresh-applications-page` at `ce18416` (tasks
084 to 087 merged).

- `applicationsRoute` picks `ApplicationsRouteWithDocuments` when
  `DOCUMENTS_FEATURE_ENABLED` (dev and tests), otherwise the "Coming
  soon" fallback. The route loads jobs and documents and shows one error
  with one retry for either failure.
- `ApplicationsPage` renders one `Card` per job that has documents (the
  company as title, the role as subtitle, "Open job" as the action),
  most recent submission first, via `groupDocumentsByJob`. Each document
  row shows its version label, type, an "Open link" external link when
  it has a URL, and "Submitted {date}" or "Not sent yet".
- Loading, error with retry, and empty (a card titled "Applications")
  states exist. Documents of deleted jobs are left out.
- A document (`TJobDocument`) has `type` (CV, cover letter, portfolio,
  other), `title` (the version label), and optional `url`,
  `submittedAt`, and `notes`.

## Decisions

### D1 - Map the mock to real fields

| Mock                         | Real field                       | Shown as                                                                         |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Company, Role                | the job's `company`, `roleTitle` | group header                                                                     |
| Document                     | `title` and `type`               | row label and type badge                                                         |
| Status: Submitted            | `submittedAt` set                | "Submitted {date}", success tint                                                 |
| Status: Draft, Ready to send | no such state                    | dropped                                                                          |
| (none)                       | `submittedAt` unset              | "Not sent yet", warning tint                                                     |
| Updated                      | none (no document timestamps)    | dropped; the submitted date is the only date                                     |
| View                         | `url`                            | "Open link", external                                                            |
| Add document                 | none on this page                | dropped; documents are added from a job's Documents tab, which the subtitle says |

Rejected: **Draft and Ready to send counts or badges.** The model has no
such states, and the task rules out new ones.

### D2 - A stats bar of real counts

Above the list, a stats bar in the style of the Jobs page (task 086):
documents submitted, documents not sent yet, and jobs with documents,
counted from the grouped documents, so documents of deleted jobs are not
counted, matching the list. It is a `dl` in a group named "Documents by
status", hidden when there are no documents.

Rejected: **the mock's three metric cards.** Two of its three counts
have no data behind them.

### D3 - A switchable matrix and card grid

At the owner's request, after a first version that listed documents
under each job, the "Application materials" card has two layouts,
switched by a "Matrix | Cards" segmented control in its header (the Jobs
page's switch style, now `getSegmentClassName` in the shared UI utils):

- **Matrix** (the default): a table with one row per job and one column
  per document type in use (CV, cover letter, portfolio, other, in that
  order; a type nobody used gets no column). A cell lists that job's
  documents of that type, each with a sent (filled green) or not-sent
  (amber ring) marker, the version label, "Submitted {date}" or "Not
  sent yet", and "Open link"; an empty cell shows a dash and "None" for
  screen readers. The row header holds only the company and role, since
  screen readers repeat it for every cell; the "Open job" button has
  its own last column. It answers "which CV went where" at a glance.
- **Cards**: a grid of job cards (one column on phones, two from `sm`,
  three from `2xl`) with the company, role, the job's status pill, its
  documents with the same markers and a type badge, and the same "Open
  job" button at the foot.

Both layouts link to the job through `JobDetailAction`, the Jobs table's
action, now a small button with the details icon and "Open job" in a new
shared `soft` button variant (the primary tint of the active sidebar
item), named "Open job for {company}" for screen readers. It replaced a
first plain text link, which was small, had no focus ring, and matched
nothing else in the app, and the Jobs table's icon-only button. The
matrix column is sized for the German "Job öffnen". In the Jobs table,
which renders from `md` and whose columns are already at their content
minimum below `2xl`, the text would add a sideways scroll, so there it
is hidden (`md:hidden 2xl:inline`) and only the icon shows; the phone
list keeps it. The matrix does the same below `2xl` (`hidden 2xl:inline`,
column `w-16 2xl:w-44`); Role gives
Actions 6% of the width. `sr-only` was tried first and dropped: its
absolute label escaped the table's scroller and widened the page, and
`not-sr-only` resets `white-space`, so the label wrapped.

After that, from the owner's review: the Jobs Actions header and button
are left-aligned like every other column (the header was `text-right`
since before this task); unselected segments of the view switches take
`hover:bg-primary-50`, as the language switch and sidebar do; and sort
header buttons take the same tint as a small chip, with the arrow turning
primary. A button audit across the app found Edit, Delete, Cancel, and
"New ..." actions in different variants on different pages, so
`frontend/AGENTS.md` §3 now has a "Button variants" table. This change
applies it only to Discover's "New search" (`secondary` to `primary`, as
"Add Job" and "New profile"); the Profile, Job Detail, and job form
mismatches are listed in tasks 090, 091, and 092, which refresh those
pages.

The matrix needs width, so below `xl` the switch is hidden and the page
shows cards: at 1024 px beside the sidebar, four type columns got 88 px
each and rows grew to 237 px. `useBreakpoint('xl')` decides, so only one layout is in the
DOM, as `DataTable` does with `md`. Each "Open link" is named "Open link
for {label}", since a matrix row or card can hold several.

Rejected, offered with these:

- **A "Not sent yet" / "Sent" split**, action-focused but loses the
  per-job view.
- **A sent-date timeline**, an activity history that hides which
  material went where.
- **The mock's flat table**, which repeats company and role per row and
  loses the grouping the task keeps.

### D3a - Long lists: search, filter, pages

Asked what happens with a long list, the page reuses the Jobs page's
pieces rather than its own copies: `useDataTable` (no columns, no sort)
for search, filter, and paging; `DataTableToolbar`, whose sort props are
now optional, with a search over company, role, document labels, and
document type names, and a "Show" select (all jobs, or jobs with an
unsent document); and `DataTablePagination` (now exported, with an
optional summary so it counts "jobs", not "rows") at 10, 25, or 50 jobs
per page, 10 by default. Paging appears only once the jobs outgrow the
smallest page, judged on every job rather than the matches, so it and the
chosen page size stay put while a search narrows the list. A new
search or filter starts again from the first page. The filter reset
lives in `useDataTable`, keyed on a plain `filterKey` value (the
selected filter or status) rather than the predicate's identity, which
an inline predicate would change on every render; the Jobs page's status
filter gets it too. The key must cover every value the predicate reads,
as its doc comment says. The matrix takes its type columns from every job, so they
stay put while paging or searching. The stats bar keeps counting every
job, as the Jobs page's does. No match shows "No matching
applications". The matrix table is named "Documents by job and type",
apart from the card's "Application materials", so screen readers do not
announce one name twice, and the Cards segment has its own grid icon
rather than the Jobs pipeline's. The stats bar is the shared `StatsBar` in
`components/ui`, which the Jobs page's bar now uses too. From `lg` up
the toolbar gives each shown control a column, so a search with one
filter leaves no empty track. The search text of each job is built once
per data change, not on every keystroke. Both layouts render a document through one
`ApplicationDocumentItem`, and each job card is an `article`, not a
named section, so a page of cards does not flood the landmark list.

Rejected: **"Show more" loading.** Pages match the Jobs table and keep
the footer reachable.

### D4 - States

Loading and error keep `LoadingState` and `ErrorState` with retry. The
empty state sits in the same "Application materials" card, so its
heading changes from "Applications" to that title; the test changes with
it. The production fallback keeps `ComingSoonPage`.

### D5 - Focused checks

Per the owner's rule in `AGENTS.md` section 3, verification runs the
Applications page, route, and utility tests plus lint, format, and type
checks; the full suite and E2E are left to CI. The task file's
`npm run frontend:verify` step is superseded by that rule.

## Proposed Change

- `features/applications/applications.utils.ts`: `countApplicationDocuments`.
- `features/applications/components/ApplicationsSummary.tsx`: stats bar.
- `features/applications/components/ApplicationsMatrix.tsx` and
  `ApplicationCards.tsx`: the two layouts of the materials card.
- `components/ui/ui.utils.ts`: `getSegmentClassName`, moved from the
  Jobs config so both switches share it.
- `components/dataTable/index.ts`: exports `DataTablePagination`.
- `features/applications/applications.constants.ts`: type tints;
  `getDocumentTypeColumns` in the utils, ordered by `DOCUMENT_TYPES`.
- `types/job/jobDetail.types.ts`: `DOCUMENT_TYPES`, the one ordered list
  `TJobDocumentType` is derived from, also used by the job detail select.
- `components/ui/StatsBar.tsx`: the stats bar shared with the Jobs page.
- `components/dataTable/parts/DataTableToolbar.tsx`: columns follow the
  shown controls.
- `pages/applications/ApplicationsPage.tsx`: stats bar and the card.
- `i18n/locales/en.json`, `de.json`: card title and subtitle, stats
  labels.

## Tests

- Counts: submitted, not sent, and jobs, leaving out deleted jobs.
- Groups keep their order, headings, job links, and document links.
- Empty, loading, and error states, and the route fallback.
- Long labels and URLs wrap (checked in the running app).

## Implementation Order

1. The count utility and its test.
2. The stats bar.
3. The page; expect the heading-order and empty-state tests to fail
   until they query the new structure.
4. Strings, focused checks, and a visual check with the dev mock.

## Verification Plan

Focused Vitest files for the changed and affected code, ESLint, Prettier,
and `tsc -b`, then a visual check at desktop and phone widths in the dev
server. Full suite and E2E in CI.

## Scope Boundaries

- No API, schema, storage, or feature-flag changes.
- No uploads, content, snapshots, or new document states.

## Completion Rules

Mark this plan and the task Completed after the focused checks pass,
and update the phase backlog.

## Acceptance Criteria

- [x] Applications uses the approved design with real metadata.
- [x] Existing links and document grouping still work.
- [x] Flagged, empty, loading, and error states remain clear.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests pass.

## Verified State

- A stats bar, a search-and-filter toolbar, and one "Application
  materials" card that switches between a matrix of jobs by document
  type and a grid of job cards from `xl` up (cards only below), paged
  ten jobs at a time.
- Focused checks: the Applications page, utility, and route tests, the
  Jobs page and config, the data table, and the icons (26 files, 108
  tests after the second review round; 109 after the third), ESLint, Prettier, and `tsc -b`
  passed. After the fourth (shared `StatsBar`, `DOCUMENT_TYPES`,
  toolbar columns, paging judged on every job): the ui, data table,
  applications, jobs, and job detail features, the Applications and Jobs
  pages, the route, documents service, and icons (82 files, 418 tests),
  plus ESLint, Prettier, and `tsc -b`, passed. The full suite and E2E are left to CI.
- Long titles and URLs (a task test item) are covered by the visual
  checks below rather than a unit test: jsdom has no layout, so a test
  could only assert class names.
- Checked in the dev server with the mock data (12 jobs): matrix and
  cards at 1536 px, "1-10 of 12 jobs" paging, search narrowing to one
  job, the matrix at 1040 px with long text injected, and cards at
  390 px with no switch and no overflow. After the fourth round: the
  Applications toolbar at 1536 px is one wide column plus the "Show"
  select, the Jobs toolbar keeps its three controls, and both stats bars
  hold at 390 px (Jobs: the total across a 2x2 grid).
- Fifth review round (PR 73): the Jobs table's label hides from `md`,
  where the table starts, not `lg`; Previous and Next step from the page
  shown, not a stored index past the last page; the board card is named
  "Open job for {company}" like the table, and `a11y.viewJobDetailsFor`
  is gone; a picked page size keeps paging shown when the list shrinks
  to one page; `StatsBar` uses `classNames`; and the matrix moved to `xl`
  with an icon-only action below `2xl`. Measured with a fourth type
  column cloned in: 164 px per column and 105 px rows at 1280 px, 184 px
  and 89 px at 1536 px, cards at 1024 px, the Jobs table icon-only at
  800 to 1000 px. Focused checks: 345 tests in 97 files, ESLint,
  Prettier, and `tsc -b`. Kept as they are, with reasons in the PR: the
  `filterKey` contract (an inline predicate would reset every render),
  the search-text map (asked for by the first review), and Discover's
  "New search" as `primary` (one per card, per `frontend/AGENTS.md`).
- Owner request in the same round: the icon-to-text gap is 4px
  (`gap-1`, was 8px) in every button and switch: `getButtonClassName`,
  `getSegmentClassName`, sort headers, the status-change chips (was
  6px), the header's Profile button, and the sidebar's collapse button.
  Sidebar navigation links keep their 12px.
