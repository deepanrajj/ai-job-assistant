# Task 032 - Connect Timeline Tab To Backend Plan

Status: Completed

## Purpose

Make the job detail timeline tab read real timeline events through a new
`timelineService` instead of rendering `job.timeline`, which has been an
empty array on every backend job since task 023's `mapJobToJobDetail`.
Task 019 built the backend endpoint (`GET /jobs/{jobId}/timeline`);
nothing on the frontend has called it yet.

This is the same shape as tasks 030 (tasks) and 031 (notes), one tab
later, but strictly read-only: the task file excludes both "timeline
event mutation UI" and "backend status event creation." There is no
create/update/delete to build, and no add-event form to disable while a
write is in flight.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/032-connect-timeline-tab-to-backend.md`
- `docs/business/019-track-timeline-events-when-job-status-changes-plan.md`
  (the backend write path that produces the events this task reads) and
  `backend/src/main/kotlin/com/smartjobtracker/timeline/` (read directly;
  verified below)
- `docs/business/031-connect-notes-tab-to-backend-plan.md` (the pattern
  this follows for the read/loading/error shape)
- `docs/business/030-connect-tasks-tab-to-backend-plan.md` (origin of
  the review lessons task 031 already folded in and this task reuses)

## Current State

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the backend endpoint | `GET /jobs/{jobId}/timeline` (`TimelineEventController`), 404s through the shared job-not-found handling when the job does not exist |
| async state | `useAsyncMutation`, with request-id race guarding |
| the load-only hook shape | `useJob`/the read half of `useJobNotes` - loads on mount, exposes `reload` |
| the tab's static markup | `JobDetailTimelinePanel`: an ordered list of dot + title + description + date |
| the dispatch that will bind `job.id` into the panel | `JobDetailActivePanel` |
| an empty-state component | `components/ui/EmptyState`, already used by `DashboardRecentActivity` for an empty job list |

### What is missing

- Nothing calls the timeline endpoint. `JobDetailTimelinePanel` renders
  `job.timeline`, and every `TJobDetail` has `timeline: []`
  (`mapJobToJobDetail`).
- No frontage service exists for timeline events - `frontend/src/services`
  has `jobs`, `notes`, `tasks`, `ai`, but no `timeline`.
- No loading, empty, or error state exists on the panel at all; today it
  unconditionally renders an `<ol>`, empty or not, inside a `Card`.
- No `MOCK_TIMELINE_EVENT_IDS`/`createMockTimelineEventResponse` fixture
  exists, the timeline-shaped counterpart of `test/mockNotes.ts`.
- `TNoteResponse`-style APP_ERROR_CODES entry: no
  `TIMELINE_REQUEST_FAILED` code exists yet.

### Verified before writing this plan

**The wire shape has no `title` field, unlike `TJobTimelineEvent`.**
Read `TimelineEventResponse.kt`: `{ id, jobId, type, description,
previousStatus, nextStatus, createdAt }`. `TJobTimelineEvent` (frontend)
is `{ id, title, description, createdAt }`. There is no backend field
that maps directly to `title`; `mapTimelineEventResponseToJobTimelineEvent`
has to synthesize one (Decision 3).

**`type` has exactly one value today.** Read `TimelineEvent.kt`:
`enum class TimelineEventType { STATUS_CHANGE }`. Read
`JobService.updateJob`: the only place a `TimelineEvent` is constructed,
and it always passes `TimelineEventType.STATUS_CHANGE`, with
`description = "Status changed from $previousStatus to $nextStatus."`.
No job-creation event is written anywhere. So every event this task will
ever render today is a status change, and the description already
carries the full human-readable detail.

**The endpoint is job-scoped and already excludes writes.** Read
`TimelineEventController.kt`: only `@GetMapping("/jobs/{jobId}/timeline")`
and the cross-job `@GetMapping("/timeline-events")`; no `@PostMapping`,
`@PutMapping`, or `@DeleteMapping` exists anywhere in the `timeline`
package. Confirms the task file's "out of scope: backend status event
creation" describes the real state, not just a task boundary - there is
nothing to call even if this task wanted to.

**Nothing else reads `job.timeline`.** Grepped `job.timeline` and
`\.timeline\b` across `frontend/src/features/jobDetail` and
`frontend/src/pages`: the only reader is `JobDetailTimelinePanel` and its
own test. `mockJobDetails.ts` still seeds a `timeline` array (as it still
does for `notes` and `tasks`, left in place by tasks 030 and 031); this
task leaves it as-is, the same precedent.

**`IJobDetailPageActions` carries no timeline callback to remove.**
Unlike notes (task 031) and tasks (task 030), `jobDetail.types.ts` never
declared an `onCreateTimelineEvent`-shaped member - grepped `timeline`
across `features/jobDetail/jobDetail.types.ts` and found nothing. There
is no dead prop-threading to clean up in this task.

## Decisions

Tasks 030 and 031 already made and defended the decisions this task
reuses for its read path; each entry below either points at the one it
reuses or explains why this task's read-only shape needs something
different.

### Decision 1: the timeline panel fetches for itself; `job` is replaced by `jobId`

`JobDetailTimelinePanel` takes `jobId: string` instead of `job:
TJobDetail`, and owns a new hook, `useJobTimeline(jobId)`. Same reasoning
as task 030 decision 1 and task 031 decision 1: the timeline belongs to
one tab, `JobDetailActivePanel` already unmounts the panel for whichever
tab is not active, and threading a hook's state through two more
components for one panel's sake is the rejected alternative there too.

### Decision 2: `useJobTimeline` has no mutations, so no `mutationError` and no reload-after-write

Tasks 030 and 031 both track a `mutationError` state and reload the list
after every write. There is no write here - the task file puts both
"timeline event mutation UI" and "backend status event creation" out of
scope, and the backend confirms there is no write endpoint to call (see
Current State). `useJobTimeline` returns exactly what `useJob`'s load
half returns: `events`, `isLoading`, `loadError`, `reload`. No
`isMutating`, no `mutationError`.

### Decision 3: title is derived from `type`, not carried on the wire

`TJobTimelineEvent.title` has to come from somewhere, and the backend
does not send one. Rejected: leaving `title` empty or reusing
`description` for both - the panel would render the same sentence twice.
Chosen: a `TIMELINE_EVENT_TYPE_TITLE_TRANSLATION_KEYS` lookup, keyed on
`TTimelineEventType` and resolved through `translate()`, the same shape
`NOTE_FALLBACK_ERROR_TRANSLATION_KEYS` already uses for a wire-driven key
into a fixed translation table. With one enum member today it produces
one title ("Status change"), but it is keyed on the type rather than
hardcoded, so a second `TimelineEventType` the backend adds later fails
to compile here (`Record<TTimelineEventType, string>`) instead of
silently rendering no title.

### Decision 4: `previousStatus`/`nextStatus` are modeled on the wire type but dropped by the mapper

`TTimelineEventResponse` mirrors the full response body Task 019's
backend sends (minus `jobId`, excluded for the same reason
`TNoteResponse`/`TTaskResponse` exclude it: every route is already
job-scoped, so the frontend never needs to re-derive it from the body).
`mapTimelineEventResponseToJobTimelineEvent` drops `previousStatus` and
`nextStatus`, the same way `mapNoteResponseToJobNote` drops `updatedAt`:
`TJobTimelineEvent` has no field for either, and the description already
states both statuses in prose. Modeling them on the response type (even
though they're not read further) keeps the wire type an honest mirror of
what `/api/jobs/{jobId}/timeline` actually returns, matching
`TTaskResponse`'s and `TNoteResponse`'s own fidelity to their responses.

### Decision 5: the panel gets an explicit empty state

Neither the tasks nor the notes panel has one, because both always
render a create form above the list - an empty list is never the only
thing on screen. The timeline panel has no form at all, so a job with no
status changes yet (every `WISHLIST`/newly-saved job, since only a
status change writes an event) would otherwise render a bare `Card` with
nothing in it. `EmptyState` (already used by `DashboardRecentActivity`)
renders in that case, keyed on `jobDetail.timeline.empty` /
`jobDetail.timeline.emptyDescription`. This is also the task file's own
requirement ("Show loading, empty, and error states"), the one line of
the three tabs' shared task shape that differs from 030/031's task
files.

### Decision 6: the timeline panel is keyed on the job id at its call site

`JobDetailActivePanel` renders
`<JobDetailTimelinePanel jobId={job.id} key={job.id} />`, matching the
tasks and notes panels. Same reasoning as task 030 decision 7 / task 031
decision 7: without a `key`, a `jobId` change that does not unmount the
subtree leaves a previous job's loaded events rendered under the next
job's heading until the new request resolves.

### Decision 7: a shared `MOCK_TIMELINE_EVENT_IDS` fixture, not duplicated literals

`test/mockTimeline.ts` exports `MOCK_TIMELINE_EVENT_IDS` and
`createMockTimelineEventResponse`, mirroring `test/mockNotes.ts` and
`test/mockTasks.ts`. Same reasoning as task 031 decision 9.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/services/timeline/timeline.types.ts` | `TIMELINE_FALLBACK_ERROR_TRANSLATION_KEYS`, `TTimelineFallbackErrorKey`, `TTimelineEventType`, `TTimelineEventResponse` |
| `frontend/src/services/timeline/timeline.service.ts` | `getTimelineEvents(jobId)` |
| `frontend/src/services/timeline/timeline.service.test.ts` | covers the request, encoding, and error passthrough |
| `frontend/src/services/timeline/timeline.utils.ts` | `getTimelineFallbackErrorMessage`, `TIMELINE_EVENT_TYPE_TITLE_TRANSLATION_KEYS`, `mapTimelineEventResponseToJobTimelineEvent` |
| `frontend/src/services/timeline/timeline.utils.test.ts` | covers the mapper |
| `frontend/src/services/timeline/index.ts` | barrel, mirrors `services/notes/index.ts` |
| `frontend/src/features/jobDetail/useJobTimeline.ts` | the read-only hook from decisions 1-2 |
| `frontend/src/features/jobDetail/useJobTimeline.test.tsx` | its test, against MSW |
| `frontend/src/test/mockTimeline.ts` | `MOCK_TIMELINE_EVENT_IDS`, `createMockTimelineEventResponse` (decision 7) |

### Changed files

| File | Change |
| --- | --- |
| `services/index.ts` | add `export * from './timeline';` |
| `types/error/error.types.ts` | add `TIMELINE_REQUEST_FAILED` to `APP_ERROR_CODES` |
| `features/jobDetail/components/JobDetailTimelinePanel.tsx` | take `jobId`, call `useJobTimeline`, render loading/empty/error/list states |
| `features/jobDetail/components/JobDetailTimelinePanel.test.tsx` | rewritten against MSW |
| `features/jobDetail/components/JobDetailActivePanel.tsx` | pass `jobId={job.id} key={job.id}` instead of `job` for the `timeline` branch |
| `features/jobDetail/components/JobDetailActivePanel.test.tsx` | drop the prop-driven timeline case from "renders the selected read-only panel"; add a jobId-threading case matching tasks/notes |
| `test/handlers.ts` | a default `GET /api/jobs/:jobId/timeline` handler returning `[]`, mirroring the tasks/notes defaults |
| `i18n/locales/en.json`, `de.json` | add `timeline.fallbackError.listTimeline`, `jobDetail.timeline.loading`, `jobDetail.timeline.loadErrorTitle`, `jobDetail.timeline.empty`, `jobDetail.timeline.emptyDescription`, `jobDetail.timeline.eventType.statusChange` |

`JobDetailTimelinePanel` props become `{ jobId: string }`.

## Tests

### New: `timeline.service.test.ts`

Same case shape as `notes.service.test.ts`'s list-only cases (no
create/update/delete exist to test):

| Case | Asserts |
| --- | --- |
| requests a job's timeline with the list error mapping | `getJson` called with the right URL and error mapping |
| encodes a job id that could otherwise escape the path | mirrors notes' `it.each` encoding case |
| lets `AppError` instances from the API client through untouched | mirrors notes' passthrough case |

### New: `timeline.utils.test.ts`

`mapTimelineEventResponseToJobTimelineEvent`: one case, a `STATUS_CHANGE`
response mapping to `{ id, title: 'Status change', description,
createdAt }` with `previousStatus`/`nextStatus` dropped.

### New: `useJobTimeline.test.tsx`

| Case | Asserts |
| --- | --- |
| loads and maps timeline events | list renders |
| a failed list load is `loadError` | `events` stays `[]`, retry works |

### Rewritten: `JobDetailTimelinePanel.test.tsx`

Drops `job`/`mockJobDetails`; renders
`<JobDetailTimelinePanel jobId={MOCK_JOB_IDS.celonis} />` against
`server.use` handlers per case.

| Case | Asserts |
| --- | --- |
| renders loaded timeline events with localized dates | title, description, and date all render |
| renders the loading state | `role="status"` while the request is in flight |
| renders the empty state when there are no events | decision 5 |
| renders the load error with a working retry | `role="alert"`, retry re-fetches |

### Changed: `JobDetailActivePanel.test.tsx`

Drops the `rerender(...timeline...)` step from "renders the selected
read-only panel" (it now fetches, so it belongs with the tasks/notes
jobId-threading cases instead); adds "passes the current job id to the
timeline panel", mirroring the existing tasks/notes cases: an MSW handler
keyed to `mockJobDetails[0].id` returning one event, asserting the panel
renders it.

### Unchanged: `JobDetailTabs.test.tsx`, `JobDetailPage.test.tsx`

Neither ever referenced `JobDetailTimelinePanel`'s props by name, and the
task file has no writes to remove from "offers no write it cannot
complete" (timeline was never in that list - confirmed by grepping
`JobDetailPage.test.tsx` for `Timeline`, which only matches the existing
tab-switch assertion). Both are expected to stay green once the new
`test/handlers.ts` default exists, the same proof tasks 030 and 031 ran
for their own defaults.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add `TIMELINE_REQUEST_FAILED` to `APP_ERROR_CODES`.
3. Add `services/timeline/timeline.types.ts`, `.service.ts`, `.utils.ts`,
   and their tests, plus the barrel and the `services/index.ts` export.
   Nothing consumes it yet; the rest of the suite stays green.
4. Add the default MSW handler in `test/handlers.ts`. Run
   `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`, and
   `JobDetailPage.test.tsx` before anything else changes - they must stay
   green on the shared default alone.
5. Add `test/mockTimeline.ts`.
6. Add `useJobTimeline` and its test.
7. Rewrite `JobDetailTimelinePanel` for `jobId`. Run its existing test
   **before** touching it: every case must fail to compile or fail to
   find `job`, proving the panel no longer reads a prop-supplied event
   list. Then rewrite its cases, including the new empty-state case.
8. Update `JobDetailActivePanel`'s `timeline` branch and its test.
9. Add the six translation keys, both locales.
10. `npm run frontend:verify`.
11. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/services/timeline/timeline.service.test.ts
```

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/useJobTimeline.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/components/JobDetailTimelinePanel.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract change;
the task file's own validation line is `npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No timeline event mutation UI and no backend status event creation,
  per the task file.
- No tasks tab change (task 030, done) and no notes tab change (task
  031, done).
- No new library, and no data-fetching library, per
  `frontend/AGENTS.md` section 5.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/032-connect-timeline-tab-to-backend.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated, for the same reason tasks 030 and
  031 recorded: it does not enumerate which tabs are backend-fed at this
  level of detail.

## Acceptance Criteria

- [x] Timeline tab uses backend data.
- [x] Empty and error states are accessible.
- [x] Tests cover visible states.

## Verified State

Built as planned, following the decisions above exactly.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 122 test
files and 379 tests, 100 percent of lines (1024/1024) and functions
(405/405), production build fine. Branch coverage is 98.96 percent; the
same three pre-existing files below it (`jobFormSchema.ts`,
`JobDetailPage.tsx`, `EditJobForm.tsx`, `NewJobPage.tsx`) reported in
task 031's verified state are still the only ones below full branch
coverage - confirmed from the per-file report, no new gap introduced.

### What was built

`useJobTimeline(jobId)` loads a job's timeline events and exposes
`events`, `isLoading`, `loadError`, and `reload` - no mutation state,
since the backend has no write endpoint for timeline events.
`JobDetailTimelinePanel` owns this hook directly and takes `jobId`
instead of a `job` prop, rendering loading, load-error, empty, and
loaded-list states; `JobDetailActivePanel` renders it keyed on `job.id`,
matching the tasks and notes panels. A new `services/timeline` module
(`getTimelineEvents`, `mapTimelineEventResponseToJobTimelineEvent`, and
the fallback-error/title translation-key tables) mirrors the shape of
`services/notes`, minus every write. `TIMELINE_REQUEST_FAILED` was added
to `APP_ERROR_CODES`.

### Failures observed deliberately

`JobDetailTimelinePanel.test.tsx` was run once before the panel's
rewrite, still passing against the old `job`-prop implementation and its
static `mockJobDetails` fixture; it was then replaced with an MSW-backed
rewrite as the panel itself changed, the same order tasks 030 and 031
used. `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`, and
`JobDetailPage.test.tsx` were run against the new default `[]` MSW
handler alone, before the panel's rewrite, and stayed green, confirming
the shared default covers their incidental Timeline-tab clicks.

### Changed from the plan

None. The design followed the plan's decisions as written, including the
empty state (decision 5), which the tasks/notes precedent did not need.
