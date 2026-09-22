# Task 031 - Connect Notes Tab To Backend Plan

Status: Completed

## Purpose

Make the job detail notes tab read and write real notes through
`noteService` instead of rendering `job.notes`, which has been an
empty array on every backend job since task 023's `mapJobToJobDetail`.
Task 022 built the service; nothing has called it yet.

This is the same shape as task 030 (tasks), one tab later: a
self-fetching panel owning its own hook, replacing dead
`onCreateNote`/`onUpdateNote`/`onDeleteNote` plumbing that
`JobDetailPage` has never populated since task 029.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/031-connect-notes-tab-to-backend.md`
- `docs/business/022-add-note-service-plan.md` (the service this calls)
- `docs/business/030-connect-tasks-tab-to-backend-plan.md` (the pattern
  this follows, including two rounds of review findings folded in
  directly rather than re-discovered here)

## Current State

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API calls | `getNotes`, `createNote`, `updateNote`, `deleteNote` (`services/notes`), job-scoped, both ids encoded |
| wire types | `TNoteResponse` (`{ id, body, createdAt, updatedAt }`), `TCreateNoteRequest`/`TUpdateNoteRequest` (`{ body }`) |
| async state | `useAsyncMutation`, with request-id race guarding |
| the list+CRUD hook shape | `useJobTasks` (task 030), reused directly |
| the tab's UI | `JobDetailNotesPanel`: add-note form, per-note inline edit textarea with save/delete, all gated on their handler prop |
| the dispatch that binds `job.id` into note callback signatures | `JobDetailActivePanel` |

### What is missing

- Nothing calls `getNotes`. `JobDetailNotesPanel` renders `job.notes`,
  and every `TJobDetail` has `notes: []` (`mapJobToJobDetail`).
- `JobDetailPage` does not pass `onCreateNote`/`onUpdateNote`/
  `onDeleteNote` to `JobDetailTabs`, so every control in the notes tab
  renders disabled or hidden today.
- `TNoteResponse.updatedAt` has no home in `TJobNote`
  (`{ id, body, createdAt }`), so the mapper drops it, the same way
  `mapJobResponseToJob` drops fields `TJob` has no place for.
- No `MOCK_NOTE_IDS`/`createMockNoteResponse` fixture exists yet, the
  note-shaped counterpart of `test/mockTasks.ts`.

### Verified before writing this plan

**Notes need no request-merging helper.** Task 030's
`buildJobTaskUpdateRequest` exists because
`PUT /api/jobs/{jobId}/tasks/{taskId}` replaces `title`, `status`, and
`dueDate` together, so a caller changing one field (the checkbox) has
to send the other two unchanged. `UpdateNoteRequest` has exactly one
field, `body`, and every note caller (the save button) already has the
full new body from its own textarea state. There is nothing to merge.
Confirmed by reading `notes.types.ts`.

**`onCreateNote`/`onUpdateNote`/`onDeleteNote` have exactly one
consumer chain and it currently receives nothing**, the same check task
030 ran for the task callbacks. Grepped the three names across
`frontend/src`: `jobDetail.types.ts` declares them,
`JobDetailTabs`/`JobDetailActivePanel` thread them, and
`JobDetailNotesPanel` is the only caller. `JobDetailPage` passes none of
them, so removing the three members deletes no live behaviour.

**Nothing else reads `job.notes`.** Grepped `job.notes` and `\.notes\b`
across `frontend/src/features/jobDetail` and `frontend/src/pages`: the
only reader is `JobDetailNotesPanel` and its own test.

## Decisions

Task 030 already made and defended the decisions this task reuses
verbatim; each one below names the reason it still applies rather than
re-arguing it, and folds in what task 030's two review rounds found so
this task does not reproduce the same defects.

### Decision 1: the notes panel fetches for itself; `job` is replaced by `jobId`

`JobDetailNotesPanel` takes `jobId: string` instead of `job: TJobDetail`
and owns a new hook, `useJobNotes(jobId)`. Same reasoning as task 030
decision 1: notes belong to one tab, `JobDetailActivePanel` already
unmounts the panel for whichever tab is not active, and threading a
hook's state through two more components for one panel's sake is the
rejected alternative there too.

### Decision 2: `useJobNotes` reloads the list after every write

Same as task 030 decision 2, including the accepted consequence: a
create, save, or delete visibly reloads the whole list, deferred to
task 035 by the same task-file boundary.

### Decision 3: mutation functions are module-level with bundled args

Same shape as `postTaskFields`/`putTaskFields`/`removeTaskFields`:
`postNoteFields`, `putNoteFields`, `removeNoteFields`, each taking one
object argument so `useAsyncMutation`'s `mutate` keeps a stable
identity.

### Decision 4: no update-merge helper is needed (see Current State)

Unlike task 030 decision 4, `updateJobNote(noteId, body)` sends exactly
the `body` the caller passes. No `buildJobNoteUpdateRequest`, no
lookup into the loaded list, no not-found guard: there is no partial
field to complete, so there is nothing for a stale id to get wrong that
the request itself will not already 404 on.

### Decision 5: no nullable-field mapping is needed

Task 030 decision 5 existed because `dueDate` is nullable on the wire
and required in `TJobTask`. `TNoteResponse.body` and `TJobNote.body` are
both plain, required strings; `mapNoteResponseToJobNote` only drops
`updatedAt`, which `TJobNote` has no field for. No empty-state branch
is added to any note-rendering helper because none is needed.

### Decision 6: every mutation rejects on failure; the panel decides who catches

Task 030 shipped with `createJobTask` rejecting but
`updateJobTask`/`deleteJobTask` swallowing their errors, an
inconsistency its second review round caught and fixed. `useJobNotes`
starts with all three of `createJobNote`, `updateJobNote`, and
`deleteJobNote` rejecting on failure, after recording `mutationError`,
matching `useCreateJob`/`useUpdateJob`'s existing contract for jobs.

`JobDetailNotesPanel` decides per call site: `handleCreateNote` awaits
and only clears its textarea on success (task 030's first review
finding, applied from the start rather than fixed after the fact);
`handleSaveNote`/`handleDeleteNote` are fire-and-forget button handlers
that catch and ignore the rejection, since `mutationError` alone
already drives what they render.

### Decision 7: the notes panel is keyed on the job id at its call site

`JobDetailActivePanel` renders `<JobDetailNotesPanel jobId={job.id} key={job.id} />`,
matching the tasks panel. Task 030's second review round found that
without a `key`, a `jobId` change that does not unmount the subtree (an
edited URL) leaves a previous job's `mutationError` rendered over the
next job's correctly loaded notes. Applied here from the start.

### Decision 8: note-taking edit handlers are memoized

Task 030's second review round also found `handleToggleTask` recreated
every render, defeating `memo()` on task rows. `JobDetailNotesPanel`'s
`handleSaveNote` and `handleDeleteNote` are `useCallback`s from the
start, keeping `MemoizedJobDetailNoteItem`'s memoization real.

### Decision 9: a shared `MOCK_NOTE_IDS` fixture, not duplicated literals

`test/mockNotes.ts` exports `MOCK_NOTE_IDS` and
`createMockNoteResponse`, mirroring `test/mockTasks.ts`. Tests import
`MOCK_JOB_IDS.celonis` for the job id and `MOCK_NOTE_IDS.primary`/
`.secondary` for note ids, rather than redeclaring UUID literals per
file - task 030's second review round found exactly that duplication
and it is avoided here from the start.

### Decision 10: mutation-error and loading states match task 030's panel exactly

Loading renders inside a `Card` with the tab's own title (so the tab
heading stays synchronous for `JobDetailTabs.test.tsx`'s existing
click-through case, the same reason task 030's panel keeps its `Card`
title outside the loading/error branches); a load error renders
`ErrorState` with a working retry; a mutation failure renders an
`Alert` above the still-visible, correctly loaded list.

### Decision 11: the empty-submission test asserts a call count directly

Task 030's second review round found its own empty-submission test only
proved nothing happened indirectly, through MSW's
`onUnhandledRequest: 'error'`. This task's equivalent test registers a
POST handler with a counter and asserts it is `0`, from the start.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobDetail/useJobNotes.ts` | the hook from decisions 1-6 |
| `frontend/src/features/jobDetail/useJobNotes.test.tsx` | its test, against MSW |
| `frontend/src/test/mockNotes.ts` | `MOCK_NOTE_IDS`, `createMockNoteResponse` (decision 9) |

### Changed files

| File | Change |
| --- | --- |
| `services/notes/notes.utils.ts` | add `mapNoteResponseToJobNote` |
| `services/notes/notes.utils.test.ts` (new) | covers the mapper |
| `features/jobDetail/jobDetail.types.ts` | drop the three note-action members from `IJobDetailPageActions` |
| `features/jobDetail/components/JobDetailNotesPanel.tsx` | take `jobId`, call `useJobNotes`, render loading/error/mutation states |
| `features/jobDetail/components/JobDetailNotesPanel.test.tsx` | rewritten against MSW |
| `features/jobDetail/components/JobDetailActivePanel.tsx` | pass `jobId={job.id} key={job.id}` instead of note callbacks for the `notes` branch |
| `features/jobDetail/components/JobDetailActivePanel.test.tsx` | drop the note-binding case, add a jobId-threading case matching the tasks one |
| `features/jobDetail/components/JobDetailTabs.tsx` | stop destructuring/threading the three note props |
| `pages/jobDetail/JobDetailPage.test.tsx` | drop the Notes-tab assertion from "offers no write it cannot complete", matching what task 030 did for Tasks |
| `test/handlers.ts` | a default `GET /api/jobs/:jobId/notes` handler returning `[]`, mirroring the tasks default from task 030 decision 8 |
| `i18n/locales/en.json`, `de.json` | add `jobDetail.notes.loading`, `jobDetail.notes.loadErrorTitle` |

`JobDetailNotesPanel` props become `{ jobId: string }`.

## Tests

### New: `useJobNotes.test.tsx`

Same case shape as `useJobTasks.test.tsx`, minus the merge-specific
case task 030 needed and its not-found case (decision 4 removes both):

| Case | Asserts |
| --- | --- |
| loads and maps notes | list renders |
| a failed list load is `loadError` | `notes` stays `[]`, retry works |
| create reloads the list | POST fires, then a second GET returns the new row |
| a failed create sets `mutationError` and does not reload | list unchanged |
| update sends the given body and reloads | PUT body is exactly `{ body }` |
| a failed update sets `mutationError` and does not reload | list unchanged |
| delete reloads the list | row is gone after the round trip |
| a failed delete sets `mutationError` and does not reload | list unchanged |

### New: `notes.utils.test.ts`

`mapNoteResponseToJobNote`: one case, a populated response mapping to
`{ id, body, createdAt }` with `updatedAt` dropped.

### Rewritten: `JobDetailNotesPanel.test.tsx`

Drops `job`/`mockJobDetails`; renders `<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />`
against `server.use` handlers per case.

| Case | Asserts |
| --- | --- |
| renders loaded notes with localized dates | |
| renders the loading state | `role="status"` while the request is in flight |
| renders the load error with a working retry | `role="alert"`, retry re-fetches |
| creates a note | form submit, POST body, list refetches and shows the new row |
| keeps the create form filled in when the create request fails | decision 6, mirroring task 030's own regression test |
| edits and saves a note | textarea edit, PUT body, list refetches with the new body |
| deletes a note | button click, DELETE fires, list refetches without the row |
| renders a mutation failure without losing the loaded notes | failed POST/PUT/DELETE shows the alert; existing rows stay visible |
| clears a stale mutation error once a later write succeeds | mirrors task 030's regression test for the same defect class |
| disables controls while a write is in flight | save/delete buttons and the add-note form |
| ignores empty note submissions | asserts a create call count of `0` directly (decision 11) |

### Changed: `JobDetailActivePanel.test.tsx`

Drops `onCreateNote`/`onUpdateNote`/`onDeleteNote` from
`createActionProps` and the "binds the current job id to note actions"
case; adds a case mirroring the tasks one: renders `activeTab="notes"`
with an MSW handler keyed to `mockJobDetails[0].id`, asserting the
panel renders that job's note.

### Changed: `JobDetailTabs.test.tsx`, `JobDetailPage.test.tsx`

No prop changes at the `JobDetailTabs` layer (it never referenced the
note callbacks by name). Both files' existing clicks into the Notes tab
are covered by the new `test/handlers.ts` default, the same proof task
030 ran for its own default handler:
`JobDetailPage.test.tsx`'s "offers no write it cannot complete" drops
its Notes-tab assertion (the tab is no longer one of the writes the
page cannot complete), matching exactly what task 030 did for the
Tasks-tab assertion in the same test.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add `mapNoteResponseToJobNote` and its test. Nothing consumes it
   yet; the rest of the suite stays green.
3. Add the default MSW handler in `test/handlers.ts`. Run
   `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`, and
   `JobDetailPage.test.tsx` before anything else changes - they must
   stay green on the shared default alone.
4. Add `test/mockNotes.ts`.
5. Add `useJobNotes` and its test.
6. Rewrite `JobDetailNotesPanel` for `jobId`. Run its existing test
   **before** touching it: every case must fail to compile or fail to
   find `job`, proving the panel no longer reads a prop-supplied note
   list. Then rewrite its cases.
7. Update `JobDetailActivePanel`'s `notes` branch and its test.
8. Remove the three members from `IJobDetailPageActions` and stop
   threading them in `JobDetailTabs`. Expect a compile error at any
   remaining reference; there should be none left after step 7.
9. Drop the stale Notes-tab assertion in `JobDetailPage.test.tsx`.
10. Add the two translation keys, both locales.
11. `npm run frontend:verify`.
12. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/useJobNotes.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/components/JobDetailNotesPanel.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No tasks tab change (task 030, done) and no timeline tab change
  (task 032).
- No saving AI answers as notes - out of scope per the task file.
- No optimistic local patching of the note list (task 035, per
  decision 2).
- No new library, and no data-fetching library, per
  `frontend/AGENTS.md` section 5.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/031-connect-notes-tab-to-backend.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated, for the same reason task 030
  recorded: it does not enumerate which tabs are backend-fed at this
  level of detail.

## Acceptance Criteria

- [x] Notes tab uses backend APIs.
- [x] Existing UI behavior is preserved.
- [x] Tests cover note user flows.

## Verified State

Built as planned, with every task-030 review lesson (decisions 6-11)
applied from the start rather than found in a later review round.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 119
test files and 367 tests, 100 percent of lines (1001/1001) and
functions (396/396), production build fine. Branch coverage is 98.94
percent; the four files below it (`jobFormSchema.ts`,
`JobDetailPage.tsx`, `EditJobForm.tsx`, `NewJobPage.tsx`) were already
there before this change, confirmed from the per-file report.

One gap the first pass left: `handleSaveNote`'s `.catch` callback in
`JobDetailNotesPanel` was never exercised, since the panel's original
mutation-failure test only covered a failed delete. Added "renders a
mutation failure from a failed save without losing the loaded notes"
to close it, mirroring the same two-cases-not-one shape task 030 ended
up with for its own toggle/delete failure coverage - applied here in
the same pass rather than needing a second review round to find it.

### What was built

`useJobNotes(jobId)` loads a job's notes and offers create, update, and
delete, each rejecting on failure after recording `mutationError` and
reloading the list from the server on success.
`JobDetailNotesPanel` owns this hook directly and takes `jobId` instead
of a `job` prop, rendering its own loading, load-error, and
mutation-error states; `JobDetailActivePanel` renders it keyed on
`job.id`, matching the tasks panel. `mapNoteResponseToJobNote` drops
the wire's `updatedAt`, which `TJobNote` has no field for.
`onCreateNote`/`onUpdateNote`/`onDeleteNote`, which had no live caller
since task 029, were removed from `IJobDetailPageActions` and the two
components that threaded them.

### Failures observed deliberately

Every existing `JobDetailNotesPanel` case failed once the panel
stopped reading a `job` prop, proving it no longer renders from
prop-supplied data. `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`,
and `JobDetailPage.test.tsx` were run against the new default MSW
handler alone, before the panel's own rewrite, and stayed green,
confirming the shared default covers their incidental Notes-tab
clicks.

### Changed from the plan

None beyond the one added test case above; the design followed the
plan's decisions as written.
