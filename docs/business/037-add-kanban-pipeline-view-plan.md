# Task 037 - Add Kanban Pipeline View Plan

Status: Completed

## Purpose

Let a user scan saved jobs by application status without leaving the
Jobs page, by adding a Kanban pipeline view next to the existing
table view. The task file scopes this to viewing only: grouping by
the six existing statuses, cards that link to job detail, and an
accessible view switch. Drag-and-drop status updates, backend
changes, and new statuses are explicitly out of scope.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/037-add-kanban-pipeline-view.md`

## Current State

### Audited: how `JobsPage` renders today

| Piece | File | Current content |
| --- | --- | --- |
| Page | `pages/jobs/JobsPage.tsx` | loading/error branches, then a single `DataTable<TJob>` with title, summary, actions (Add Job button), filters (status select), and search |
| Column/action/filter builders | `features/jobs/jobs.config.tsx` | `createJobsColumns`, `createJobsActions`, `createJobsFilters`, `createJobsSearchConfig` - small factory functions returning `ReactNode`/config objects from `t` and handlers |
| Status data | `features/jobs/jobs.constants.ts` | `jobStatusOptions` (six statuses, in pipeline order), `statusOptions` (`'ALL'` + the six), `statusPillClasses` |
| Status pill | `features/jobs/components/StatusPill.tsx` | color-coded `Badge` per `TJobStatus`, translated via `JOB_STATUS_TRANSLATION_KEYS` |
| Detail link | `features/jobs/components/JobDetailAction.tsx` | icon-only `Link` to `APP_PATH_BUILDERS.jobDetail(job.id)`, accessible name from `a11y.viewJobDetailsFor` |
| `DataTable` | `components/dataTable/DataTable.tsx` | fully self-contained: renders its own header (`title`/`renderSummary`/`actions`) when any of those are given, then toolbar (search+filters), then desktop/mobile rows or `EmptyState`, then pagination. `title`, `actions`, `filters`, `search`, `renderSummary` are all optional. |

**`DataTable` is table-shaped only.** Its `useDataTable` hook drives
sorting/pagination/search over one flat row list; there is no grouped
or column-based rendering mode. A Kanban board is a different layout
(N status columns, not paginated rows), so it is a new component, not
a `DataTable` mode.

**No toggle/segmented-control component exists yet.** Grepped
`aria-pressed`, `ToggleGroup`, `SegmentedControl`, `viewMode` across
`frontend/src`: no matches. `components/ui` has `Button`, `Badge`,
`Card`, `EmptyState`, `Select` and others, but nothing shaped like a
two-option toggle - it is built from two `Button`s.

**No list/board icons exist yet.** `components/icons` has `PlusIcon`,
`DetailsIcon`, `EditIcon`, `TrashIcon`, `SearchIcon`,
`ExternalLinkIcon`, `ArrowLeftIcon`, `LanguageIcon` - none fit a
table/board view switch. Two new icons are needed, following the
existing memoized-SVG-component pattern (see `PlusIcon.tsx`).

### Verified before writing this plan

**`jobStatusOptions` is already in the pipeline order the product
expects** (`WISHLIST`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`,
`WITHDRAWN`), read from `jobs.constants.ts`. The Kanban board reuses
this array directly for column order - no new ordering constant
needed.

**Translation lookup has no pluralization support.** Read
`i18n/utils/translation.ts`: `translate`/`interpolate` do plain
`{{placeholder}}` substitution only. The existing `jobs.countSummary`
key already sidesteps plural forms with wording that reads fine at
any count ("X of Y opportunities shown"). The new per-column count
copy follows the same pattern instead of adding pluralization logic.

**`Button` spreads native button attributes**, confirmed by reading
`Button.tsx`: `IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`
and `{...props}` reaches the rendered `<button>`. `aria-pressed` on a
`Button` therefore works with no `Button` changes.

## Decisions

### Decision 1: a view toggle built from two `Button`s, not a new `ui` primitive

Two `Button`s (`variant="primary"` when active, `variant="secondary"`
when not) inside a `role="group"` `div` with an
`aria-label`, each carrying `aria-pressed`. Rejected: a new
`ToggleGroup`/`SegmentedControl` component in `components/ui`. This
page has exactly one two-option toggle; a new shared primitive for a
single caller is exactly the "speculative abstraction" `AGENTS.md`
rules out. If a second toggle shows up later, it is generalized then.

### Decision 2: the toggle and "Add Job" button are built as one `createJobsActions`-family function, in `jobs.config.tsx`

`jobs.config.tsx` already holds the page's small `t`/handler ->
`ReactNode` factory functions (`createJobsActions`,
`createJobsFilters`). A new `createJobsViewToggle({ onViewModeChange,
t, viewMode })` follows the same shape and lives next to them, rather
than becoming a new `features/jobs/components/*` component file.
Rejected: a `JobsViewToggle.tsx` component. Every other control on
this page (actions, filters, search) is a config-file function, not a
component - matching that keeps the page's one existing pattern
instead of introducing a second one for a single control.

### Decision 3: `JobsPage` owns `viewMode` state; the two views share one `actions` node and one title, but each renders its own header

`DataTable` already renders its own header (title + summary + actions)
when `title`/`actions`/`renderSummary` are passed, and that stays
exactly as-is for table mode - no changes to `DataTable` or its
props. Kanban mode is not run through `DataTable` at all, so
`JobsPage` renders a second, smaller header (title + actions, no
summary line) directly above `JobsKanbanBoard` when
`viewMode === 'kanban'`. Both headers render the exact same `actions`
node (view toggle + Add Job button), computed once via `useMemo`, so
the two controls behave identically in both modes without duplicating
their construction.

Rejected: stripping `title`/`actions` out of `DataTable` and always
rendering a single shared header above both views. `DataTable`'s
`renderSummary` reads `table.summaryState`, which only exists inside
`useDataTable`'s internal state - pulling the header out of
`DataTable` would mean recomputing that summary a second time outside
the hook it belongs to, for no behavior change. Keeping `DataTable`
untouched is the smaller change.

### Decision 4: Kanban mode drops the status filter and search; it always shows all saved jobs across all six columns

The task file's Tests section only asks for grouping, empty-column
rendering, and card links - no filtered/searched Kanban tests. Status
grouping already gives the user the status filter's function (find a
status's jobs by looking at its column), so carrying the `Select`
into Kanban mode would duplicate that filter with different UI for no
new capability. Search is dropped for the same "no test asks for it"
reason, and because building a second search input against the same
`createJobsSearchConfig` shape (which searches a flat row list) is
more surface than this task's scope covers, this list stays the
`table:` `DataTable` and `Select`, `search` and `filters` config
untouched.

Rejected: passing the filtered/searched job list into Kanban too.
Rejected because status filter and status columns would then say the
same thing twice, and because it silently reintroduces the risk this
task's "no drag-and-drop" and "no new statuses" boundaries are meant
to avoid - a Kanban view that can show an empty board when a filter
and a status disagree is confusing UI, not a smaller change.

### Decision 5: no separate `JobsKanbanColumn` component

A column is a status header (translated status name + count, using
the same `JOB_STATUS_TRANSLATION_KEYS` map `StatusPill` already uses)
plus either a list of `JobsKanbanCard`s or an empty-column message.
This is written inline inside `JobsKanbanBoard`'s `.map` over
`jobStatusOptions`, not extracted to its own file. Rejected: a
`JobsKanbanColumn.tsx` file. It renders once per status, never reused
outside the board, and its JSX is short enough that a fourth file plus
a fourth test would be the "premature abstraction" `AGENTS.md` warns
against - `JobsKanbanCard` is the piece that repeats per job and is
the one worth its own file/test.

### Decision 6: mobile layout is a horizontally scrollable row, not a stacked list

Each status column gets a fixed min-width and the board wraps in a
horizontally scrolling container (`overflow-x-auto`), the same idea
`DataTableDesktop`'s wide table already uses on this page. Rejected:
collapsing to one status per screen with pager controls, or stacking
all six columns vertically. A horizontal scroll needs no new
interaction pattern (it is the same touch/scroll gesture the browser
already gives the table), keeps every column reachable, and needs no
new state.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `components/icons/TableIcon.tsx`, `.test.tsx` | table/list view icon, same shape as `PlusIcon.tsx` |
| `components/icons/KanbanIcon.tsx`, `.test.tsx` | pipeline/board view icon, same shape |
| `features/jobs/components/JobsKanbanCard.tsx`, `.test.tsx` | one job's card: company, role, location, salary, updated date, a `Link` to job detail |
| `features/jobs/components/JobsKanbanBoard.tsx`, `.test.tsx` | renders one column per `jobStatusOptions` entry, each with a status header/count and its jobs or an empty-column message |

### Changed files

| File | Change |
| --- | --- |
| `components/icons/index.ts` | export `TableIcon`, `KanbanIcon` |
| `features/jobs/jobs.types.ts` | add `TJobsViewMode = 'table' \| 'kanban'` |
| `features/jobs/jobs.config.tsx` | add `createJobsViewToggle({ onViewModeChange, t, viewMode })` |
| `features/jobs/jobs.config.test.tsx` | test the new toggle factory |
| `pages/jobs/JobsPage.tsx` | add `viewMode` state, the shared `actions` node, and the kanban branch |
| `pages/jobs/JobsPage.test.tsx` | cover switching views, Kanban grouping, empty columns, and card navigation |
| `i18n/locales/en.json`, `de.json` | new `jobs.*` keys (below) |

### New translation keys (both locales)

- `jobs.viewToggleLabel` - accessible group label for the toggle.
- `jobs.tableView` - "Table" / "Tabelle".
- `jobs.kanbanView` - "Pipeline" / "Pipeline".
- `jobs.kanbanColumnCount` - `"{{count}} opportunities"` style count
  line per column, matching `countSummary`'s existing wording pattern.
- `jobs.kanbanColumnEmpty` - "No jobs in this status" copy shown
  inside an empty column.

No new `a11y.*` key is needed: the card's link reuses
`a11y.viewJobDetailsFor`, exactly as `JobDetailAction` already does.

## Tests

### `TableIcon.test.tsx`, `KanbanIcon.test.tsx`

Same shape as `PlusIcon.test.tsx`: renders, asserts
`aria-hidden="true"` and a passed `className`.

### `JobsKanbanCard.test.tsx`

- Renders company, role, and location for a mock job.
- Renders a link with accessible name `View details for {{company}}`
  pointing at `/jobs/{id}` (mirrors `JobDetailAction.test.tsx`).
- Renders the salary line via `formatJobSalary`, and the "Not set"
  fallback when salary fields are absent (mirrors the columns test in
  `jobs.config.test.tsx`).

### `JobsKanbanBoard.test.tsx`

- Given jobs across three of the six statuses, renders six column
  headings (translated status names) each followed by that status's
  job count.
- Given jobs across three statuses, renders an empty-column message
  for each of the other three statuses, and none of the populated
  ones.
- Given a job in a specific status, renders its card inside that
  status's column, not another one (queries within the column's
  region rather than by full-document text, so two same-named
  companies in different statuses cannot pass by accident).

### `jobs.config.test.tsx`

- `createJobsViewToggle` renders two buttons named "Table" and
  "Pipeline"; the one matching `viewMode` has `aria-pressed="true"`,
  the other `aria-pressed="false"`; clicking the inactive one calls
  `onViewModeChange` with the other mode.

### `JobsPage.test.tsx`

- Defaults to the table view (existing table-mode tests keep passing
  unchanged - the default previous behavior did not move).
- Clicking the pipeline toggle swaps the `DataTable` out for the
  Kanban board (table role disappears, six status headings appear).
- Clicking the table toggle from Kanban mode swaps back and preserves
  the "Add Job" navigation behavior already covered by the existing
  "navigates to the add job route" test - re-run in the same test for
  the Kanban starting point isn't required; DataTable and Kanban
  render the identical `actions` node, so this is exercised once.
- Kanban mode's card links to the correct job detail path (reuses
  `MOCK_JOB_IDS`-style mock jobs to check `href`).
- Kanban mode renders every one of the six statuses, including ones no
  mock job uses, proving empty columns render rather than being
  omitted.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add `TJobsViewMode` to `jobs.types.ts`. Nothing consumes it yet.
3. Add `jobs.viewToggleLabel`/`.tableView`/`.kanbanView` keys to both
   locales.
4. Add `TableIcon`/`KanbanIcon` and their tests; export from
   `components/icons/index.ts`.
5. Add `createJobsViewToggle` to `jobs.config.tsx` and its test in
   `jobs.config.test.tsx`. Run it standalone - it renders and toggles
   with no page wiring yet.
6. Add `jobs.kanbanColumnCount`/`.kanbanColumnEmpty` keys to both
   locales.
7. Add `JobsKanbanCard` and its test.
8. Add `JobsKanbanBoard` and its test, built on `JobsKanbanCard`.
9. Wire `viewMode` state, the shared `actions` node, and the
   conditional header/body into `JobsPage`. Run
   `JobsPage.test.tsx` before updating it - the existing tests keep
   passing (table mode is still the default), proving the wiring is
   additive.
10. Extend `JobsPage.test.tsx` with the new view-switch/Kanban cases.
11. `npm run frontend:verify`.
12. Close out per the completion rules.

## Verification Plan

Narrow loop while iterating:

```bash
npm --prefix frontend run test -- --run src/components/icons/TableIcon.test.tsx src/components/icons/KanbanIcon.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobs
```

```bash
npm --prefix frontend run test -- --run src/pages/jobs/JobsPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required - no backend change, no API contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No drag-and-drop status changes - cards are read-only, links only.
- No backend/API change - the Kanban view groups the same `TJob[]`
  the table already receives from `useJobsList`.
- No new job statuses - `jobStatusOptions`'s existing six drive the
  columns.
- No change to `DataTable`, `useDataTable`, or any of the table's
  existing filter/search/sort/pagination behavior.
- No new `components/ui` primitive.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/037-add-kanban-pipeline-view.md` and set its status.
- Check the task off in `docs/backlog/phase-5-non-ai-workflows.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not expected to need a change - it does not
  currently describe the Jobs page's view modes at a level this task
  would contradict; re-check before closing out and update only if
  that turns out to be wrong.

## Acceptance Criteria

- [x] Kanban view exists for saved jobs.
- [x] All statuses are represented.
- [x] Keyboard users can navigate job cards.

## Verified State

Built as planned, following the decisions above with one correction
found during implementation: `groupJobsByStatus` originally built its
initial accumulator with `Object.fromEntries(...) as Record<TJobStatus,
TJob[]>`, which `tsc` rejected (`TS2352`, insufficient type overlap
between the fromEntries result and the target record) during
`frontend:build` - not caught by lint, format, or tests, only by the
build step. Rewritten as `jobStatusOptions.reduce<Record<TJobStatus,
TJob[]>>(...)`, which typechecks directly. No other part of the plan
changed.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 132
test files and 418 tests (14 added: 2 icons, `JobsKanbanCard` x2,
`JobsKanbanBoard` x4, the view-toggle case in `jobs.config.test.tsx`,
and 5 new `JobsPage.test.tsx` cases), 100 percent of lines
(1129/1129) and 100 percent of functions (445/445), production build
succeeds. Branch coverage is 99.01 percent (606/612), unchanged from
task 036's 98.99 percent baseline within rounding - no new gap opened
by this change.

Manually verified against a full local stack (`npm run dev:compose`,
backend + Postgres + frontend behind the Nginx proxy at
`localhost:30080`) with three seeded jobs across the Wishlist and
Applied statuses:

- The Jobs page defaults to the table view; the "Table" toggle button
  shows as active (`aria-pressed="true"`).
- Clicking "Pipeline" swaps in six status columns (Wishlist, Applied,
  Interview, Offer, Rejected, Withdrawn) in `jobStatusOptions` order;
  Interview/Offer/Rejected/Withdrawn render as empty columns with "No
  jobs in this status", proving empty columns render rather than being
  omitted.
- Clicking a card (Celonis, Applied) navigated to
  `/jobs/{id}` and rendered that job's detail page.
- Tabbing from the "Add Job" button moved focus onto the first Kanban
  card with a visible focus ring, confirming keyboard-only navigation
  reaches the cards.
- The board's `overflow-x-auto` horizontal scrollbar was visible under
  the four columns at desktop width, confirming the mobile-usable
  layout decision (Decision 6) renders as intended.

The docker compose stack and the standalone `vite --port 5180` dev
server used for this manual check were both torn down afterward
(`docker compose down`, dev server process stopped).

### Changed from the plan

Only the `groupJobsByStatus` implementation (see above); every
decision, file list, and test list in this plan was built as written.

### Post-merge-review fix

A `/code-review` pass on the PR flagged that `groupJobsByStatus`
indexed `jobsByStatus[job.status]` and called `.push` on the result
without checking it existed. `job.status` comes from the API response
with no runtime enum validation (`jobs.utils.ts`'s mapper assigns
`status: response.status` directly), so a status value outside the
six known `TJobStatus` literals - a backend rename, a status added
backend-first, or malformed data - would read `undefined` and throw,
crashing the whole Jobs page rather than degrading the way
`StatusPill`'s analogous lookup already does. Fixed with optional
chaining (`jobsByStatus[job.status]?.push(job)`): a job with an
unrecognized status is silently omitted from the board instead of
throwing. Added a regression test asserting a mixed known/unknown
status list renders the known job and does not throw.
`npm run frontend:verify` re-run afterward: 132 test files, 419 tests
(1 added), 100 percent lines, unchanged 99.01 percent branch coverage,
build succeeds.
