# Task 035 - Add Optimistic Updates Where Useful Plan

Status: Completed

## Purpose

Task 035 names three candidate areas: task status toggles, note edits,
and job status changes. An audit (below) found task toggling and job
status changes are both live, low-risk mutations with a clear rollback
(flip a value back), while note edits already read as instant today for
a different reason and do not need the same machinery. Asked how to
scope the task after that audit, the user chose the wider option: make
task toggling optimistic, and also wire the job-status dropdown to the
backend for the first time (it was never connected) and make that
optimistic too.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/035-add-optimistic-updates-where-useful.md`
- `docs/business/030-connect-tasks-tab-to-backend-plan.md` (the
  `useJobTasks` hook this task changes)
- `docs/business/027-connect-edit-job-form-to-backend-plan.md` (the
  `useUpdateJob`/full-replace shape this task reuses for status changes)

## Current State

### Audited: which candidate areas are actually eligible

| Candidate | Live mutation today? | Verdict |
| --- | --- | --- |
| Task status toggle (`JobDetailTasksPanel`'s checkbox) | Yes, `updateJobTask` via `useJobTasks` | Optimistic: clean fit |
| Note edits (`JobDetailNotesPanel`'s Save button) | Yes, `updateJobNote` via `useJobNotes` | Not changed - see below |
| Job status change (`JobDetailHeader`'s status select) | No - see below | Wired up in this task, then made optimistic |

**Note edits already read as instant, for a reason optimism does not
add to.** Read `JobDetailNotesPanel.tsx`: each row's textarea is
`useState(note.body)` - local to the item, seeded once from the loaded
note and never reset by a prop change. Typing, and even a failed save,
already show exactly what the user typed with no delay, because the
textarea was never wired to re-render from the fetched list in the
first place. Building an override/rollback layer for `useJobNotes`
would add real code (mirroring what this task does add to
`useJobTasks`) for a save whose visible result already looks instant.

**The job-status select has never been connected to a live mutation.**
Read `jobDetail.types.ts`, `JobDetailTabs.tsx`, `JobDetailActivePanel.tsx`,
and `JobDetailHeader.tsx`: `onStatusChange` is declared on
`IJobDetailPageActions`, explicitly excluded from what
`JobDetailActivePanel`/`JobDetailTabs` receive
(`Omit<IJobDetailPageActions, 'onDeleteJob' | 'onStatusChange'>` - both are
header-level, not tab-level, actions), and `JobDetailHeader` has its own
separate `onStatusChange?: (status: TJobStatus) => void` prop. Read
`JobDetailPage.tsx`: it renders `JobDetailHeader` directly with
`onDeleteJob`/`onEditJob` but never `onStatusChange`, so the select is
permanently `disabled={!onStatusChange}` today.
`JobDetailPage.test.tsx`'s "offers no write it cannot complete" already
asserts this: `getByRole('combobox', { name: 'Job status' })` is
disabled.

`IJobDetailPageActions.onStatusChange`'s jobId-inclusive signature
(`(jobId: string, status: TJobStatus) => void`) is not used by this
plan - `JobDetailHeader` is rendered directly by `JobDetailPage`, the
same way `onDeleteJob`/`onEditJob` already are, so there is no tab layer
to thread a job id through. That interface member stays unused after
this task, the same as before it; removing it would also require
touching the `Omit<...>` clauses in two other files for a member this
task does not touch the live path of, which is out of this task's scope.

### Verified before writing this plan

**`PUT /api/jobs/{id}` replaces every editable field**, confirmed by
reading `useUpdateJob.ts`/`useUpdateJob.test.tsx`: a status-only change
still has to send `company`, `roleTitle`, `jobUrl`, `location`,
`description`, `salaryMin`, and `salaryMax` unchanged, the same full
payload `EditJobForm` already sends. `TJobDetail` (what `JobDetailPage`
already holds) widens every one of those fields to a required,
non-null value, so building that payload from the loaded `job` needs no
extra nullable-field handling beyond what `TJobFormPayload` itself
already tolerates.

**Nothing else reads `job.status` in the job detail page tree besides
`JobDetailHeader`.** Grepped `\.status\b` across
`frontend/src/features/jobDetail` and `frontend/src/pages/jobDetail`:
only `JobDetailHeader` (`StatusPill` and the select) reads it. The
optimistic status only needs to reach `JobDetailHeader`, not
`JobDetailTabs`.

## Decisions

### Decision 1: `useJobTasks` gets a small optimistic-override layer, not a rewrite

`useJobTasks` keeps its existing `data`/`tasks` derivation. A new
`optimisticTaskOverrides: Record<string, IUpdateJobTaskInput>` state is
merged on top when deriving `tasks`, so an in-flight or just-succeeded
toggle shows immediately without waiting for `data` to catch up.
`updateJobTask` no longer calls `reload()` on success - the override
already **is** the new truth, since the caller sent exactly the fields
the backend just accepted (task 030 established `buildJobTaskUpdateRequest`
sends `title`/`status`/`dueDate` together, so there is nothing the
server could have changed that this task did not already know). On
failure, the override is restored to whatever it held before this call
(not deleted outright), because a second toggle can start before the
first's rejection is observed and rolling all the way back to the
original server value would regress past an already-successful first
toggle. `createJobTask`/`deleteJobTask` are unchanged: task 035's own
scope excludes optimistic create/delete.

### Decision 2: the override only needs `IUpdateJobTaskInput`, not a full `TJobTask`

An override is `{ status: 'DONE' }` (or `title`/`dueDate`, if this
mechanism is ever reused for those), merged onto the mapped task with
a plain spread. This matches `IUpdateJobTaskInput`'s existing shape
exactly - no new type.

### Decision 3: `useJobStatus` is a new, small hook wrapping `useUpdateJob`

Rather than adding job-status optimism directly into `useJob`/
`useJobDetail` (which own the *loaded* job and its own reload/error
state), a new `frontend/src/features/jobs/useJobStatus.ts` wraps
`useUpdateJob` with one `optimisticStatus: TJobStatus | null` and
resets it in a `useEffect` keyed on `jobId` - `JobDetailPage` does not
remount on a `jobId` route-param change (`jobDetailRoute.tsx` reads
`useParams` into the same mounted component), so without the reset a
status left over from one job would leak into the next one navigated to
directly from the detail page.

Rejected: folding this into `useJob`, which already tracks the loaded
job. Rejected because `useJob`'s state is about what was *fetched*, and
mixing an unrelated pending-write concern into it would make its
existing request-id guard and `reload` harder to reason about for a
concern (`useUpdateJob`) that already exists as its own hook.

### Decision 4: a failed status change restores the previous *shown* status, not necessarily the loaded job's status

Same reasoning as Decision 1: `changeStatus` captures whatever
`optimisticStatus` currently holds (which may itself be the result of an
earlier successful change) before applying the new one, and restores
that captured value on failure - never unconditionally back to `null`
(which would fall back to the stale, pre-any-change loaded `job.status`).

### Decision 5: the status select stays enabled while a change is in flight, mirroring the delete button

Same reasoning as `JobDetailHeader`'s existing delete button (its own
doc comment already explains this): disabling a focused control blurs
it, dropping a keyboard user's place for the length of the request. The
select gets `aria-busy` bound to `isChanging` and stays interactive; the
existing `disabled={!onStatusChange}` guard is unchanged (a handler
either exists or it does not - `isChanging` is a separate, orthogonal
condition from "is there a handler at all").

### Decision 6: a status-change failure renders as its own `ErrorState`, alongside the existing delete failure

Matches `hasDeleteFailure`'s existing shape and position in
`JobDetailPage.tsx` exactly - both are page-level write failures shown
above the header, and both can in principle be visible at once (a
failed delete does not prevent a status change and vice versa).

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobs/useJobStatus.ts` | the hook from decisions 3-4 |
| `frontend/src/features/jobs/useJobStatus.test.tsx` | its test, against MSW |

### Changed files

| File | Change |
| --- | --- |
| `features/jobDetail/useJobTasks.ts` | add `optimisticTaskOverrides`, merge into `tasks`, drop the post-update `reload()`, restore-on-failure per decision 1/4 |
| `features/jobDetail/useJobTasks.test.tsx` | cover the optimistic success and rollback cases |
| `features/jobDetail/components/JobDetailTasksPanel.test.tsx` | cover the immediate flip and the revert-on-failure, from the panel's own perspective |
| `features/jobDetail/components/JobDetailHeader.tsx` | add `isChangingStatus?: boolean`, wire `aria-busy` on the select |
| `features/jobDetail/components/JobDetailHeader.test.tsx` | cover `aria-busy` while changing |
| `pages/jobDetail/JobDetailPage.tsx` | call `useJobStatus`, compute the displayed job with the optimistic status overlaid, wire `onStatusChange`/`isChangingStatus` into `JobDetailHeader`, render a status-change failure `ErrorState` |
| `pages/jobDetail/JobDetailPage.test.tsx` | drop the disabled-select assertion from "offers no write it cannot complete"; add cases for a successful change, a failed change with rollback, and the error state |
| `i18n/locales/en.json`, `de.json` | add `jobDetail.statusChangeErrorTitle` |

No backend change, no new library.

## Tests

### `useJobTasks.test.tsx`

New cases alongside the existing ones:

| Case | Asserts |
| --- | --- |
| shows the new status immediately, before the request resolves | task flips before the `PUT` responds |
| keeps the new status after a successful update, with no reload | list is not refetched a second time |
| rolls back to the previous status on a failed update | task flips back once the `PUT` rejects, `mutationError` set |
| a second toggle started before the first fails rolls back to the first's result, not the original | covers Decision 1/4's ordering case directly |

### `JobDetailTasksPanel.test.tsx`

| Case | Asserts |
| --- | --- |
| flips a task's checkbox immediately, before the server responds | mirrors the hook test from the panel |
| reverts the checkbox and shows a mutation failure when the update fails | same, from the panel |

### New: `useJobStatus.test.tsx`

Mirrors `useUpdateJob.test.tsx`'s shape:

| Case | Asserts |
| --- | --- |
| shows the new status immediately, before the request resolves | `optimisticStatus` set synchronously |
| sends every other editable field unchanged alongside the new status | `PUT` body matches `job`'s other fields |
| rolls back to the previous status on a failed change | `optimisticStatus` reverts, `error` set |
| a second change started before the first fails rolls back to the first's result | same ordering case as the tasks hook |
| resets the optimistic status when the job id changes | effect fires on a `jobId` prop change |

### `JobDetailHeader.test.tsx`

New case: `aria-busy="true"` on the status select while
`isChangingStatus` is true, and it stays enabled (not `disabled`).

### `JobDetailPage.test.tsx`

- Drops the disabled-select line from "offers no write it cannot
  complete" (the select is no longer one of those).
- New: changes the job status through the select, asserts the `PUT`
  body, and that the select shows the new value immediately.
- New: a failed status change reverts the select and renders
  `jobDetail.statusChangeErrorTitle`.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add the optimistic-override layer to `useJobTasks` and its tests.
   Run `JobDetailTasksPanel.test.tsx` - it should stay green unchanged,
   since the panel does not care how the hook achieves the same
   observable list.
3. Extend `JobDetailTasksPanel.test.tsx` with the immediate-flip and
   revert cases.
4. Add `useJobStatus` and its test.
5. Add `isChangingStatus` to `JobDetailHeader` and its test.
6. Wire `useJobStatus` into `JobDetailPage`. Run
   `JobDetailPage.test.tsx`'s "offers no write it cannot complete"
   first, unchanged - it should now fail on the disabled-select
   assertion, proving the select actually became live.
7. Update that test and add the new status-change cases.
8. Add the translation key, both locales.
9. `npm run frontend:verify`.
10. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/useJobTasks.test.tsx src/features/jobDetail/components/JobDetailTasksPanel.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobs/useJobStatus.test.tsx src/features/jobDetail/components/JobDetailHeader.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/pages/jobDetail/JobDetailPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No optimistic behavior for note edits (already effectively instant;
  see Current State) or for any create/delete mutation, per the task
  file's own exclusion.
- No change to `IJobDetailPageActions.onStatusChange`'s dead,
  jobId-inclusive signature, and no change to `JobDetailTabs`/
  `JobDetailActivePanel`'s `Omit` clauses - unrelated cleanup outside
  this task's diff.
- No new library, no Redux/RTK Query, per the task file.
- No backend change.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/035-add-optimistic-updates-where-useful.md` and set
  its status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md` - this is the
  last task in phase 4.
- Update `docs/backlog/README.md`'s recommended next task to point at
  phase 5.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated for the tasks-toggle change, for the
  same reason tasks 030-034 recorded. The job-status wiring is a new
  live write path, not previously documented there either, so no update
  is needed.

## Acceptance Criteria

- [x] Optimistic updates exist only where useful and safe.
- [x] Rollback behavior is tested.
- [x] No new state library is introduced.

## Verified State

Built as planned, following the decisions above exactly, with one
deviation caught by coverage rather than review (see below).

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 123
test files and 397 tests (13 added), 100 percent of lines (1066/1066)
and functions (418/418), production build fine. Branch coverage is
98.99 percent (590/596); `JobDetailPage.tsx`'s one remaining gap
(`if (!(caught instanceof AppError)) throw caught;` in the
pre-existing delete handler) predates this task, confirmed with
`git diff main -- frontend/src/pages/jobDetail/JobDetailPage.tsx`. The
same three other pre-existing files (`jobFormSchema.ts`,
`EditJobForm.tsx`, `NewJobPage.tsx`) are otherwise unchanged.

### What was built

`useJobTasks.updateJobTask` is now optimistic: `optimisticTaskOverrides`
(keyed by task id) is merged into the rendered `tasks` list immediately,
the post-update `reload()` was removed since the override already is
the confirmed truth, and a failed update restores the override to
whatever it held before that call rather than deleting it outright, so
a second toggle failing cannot regress past an already-successful
first one. `createJobTask`/`deleteJobTask` are untouched.

The job-status dropdown in `JobDetailHeader`, previously wired to
nothing (`onStatusChange` was never supplied by `JobDetailPage`), is
now connected through a new `useJobStatus` hook wrapping `useUpdateJob`
with the same override-and-restore shape, sending the job's other
fields unchanged alongside the new status (the full-replace shape
`PUT /api/jobs/{id}` requires). The select shows the optimistic status
immediately and stays enabled while a change is in flight
(`aria-busy`, matching the existing delete-button pattern) rather than
disabling. `useJobStatus` resets its optimistic status when `jobId`
changes, adjusted during render rather than in a `useEffect` (see
Changed From The Plan).

Note edits were left alone, exactly as planned - `JobDetailNotesPanel`
already reads as instant for a different, structural reason (its
textarea state is local and independent of the fetched list), and
adding override/rollback machinery there would not change what the
user sees.

### Failures observed deliberately

The panel and header test files were run once before their production
code changed and stayed green, confirming the optimistic override is
purely an internal implementation swap the panel-level tests do not
need to know about. `JobDetailPage.test.tsx`'s "offers no write it
cannot complete" was run before `useJobStatus` was wired in and failed
on the disabled-select assertion exactly as expected, proving the
select had genuinely been dead until this change.

### Changed from the plan

The plan's Decision 3 said to reset the optimistic status "in a
`useEffect` keyed on `jobId`." `npm run frontend:lint`'s
`react-hooks/set-state-in-effect` rule rejected that (calling `setState`
synchronously in an effect body commits one extra stale render before
clearing it). Fixed with React's own documented alternative: comparing
`jobId` against a `previousJobId` state value during render and calling
both setters directly when they differ, which resets before that
render commits rather than one render later.

A second, smaller deviation: the plan's `handleStatusChange` wrapper in
`JobDetailPage` (guarding `if (!job) return`) was cut once coverage
showed that branch could never actually execute - the callback can only
ever be invoked from a `<select>` that only renders after the page's own
`!job` early return, the same reason `onDeleteJob`/`onEditJob` are
already inline arrows rather than null-guarded callbacks. `onStatusChange`
is now inline at the `JobDetailHeader` call site, matching that existing
pattern instead of introducing a new one.

A third deviation, found by `/code-review PR 52`: Decision 5 (the status
select stays enabled while a change is in flight) means a second,
different status change can start *and resolve* before an earlier one's
rejection is observed - not just start before it, which Decision 4
already covered. The tasks panel has no equivalent gap, because
`isMutating` disables every control panel-wide while any one write is in
flight, structurally preventing a second toggle from ever starting
before the first resolves. `useJobStatus` had no such guard, so an
earlier call's late failure could roll `optimisticStatus` back over a
newer call's already-confirmed status. Fixed with a `requestIdRef`
counter, the same request-ordering shape `useAsyncMutation`,
`useJob`, and `useJobsList` already use for their own state: only the
most recently started call's failure is allowed to call
`setOptimisticStatus`. A new test drives this ordering directly with a
manually-released response, confirming the earlier call's failure is a
no-op once a newer one has already succeeded.

A fourth deviation, from a second `/code-review PR 52` pass: two more
gaps in the same area. First, the `jobId`-change reset only cleared
`optimisticStatus`, not `useUpdateJob`'s own `error` - since
`JobDetailPage` does not remount across a job-to-job navigation, a
failed change on one job would still render as the next job's failure.
Fixed by adding `reset` to `useUpdateJob`'s returned state (a thin
pass-through of `useAsyncMutation`'s own `reset`) and calling it
alongside `setOptimisticStatus(null)`. Second, `requestIdRef` itself was
never invalidated on a `jobId` change, so a request still pending for
the previous job could still roll `optimisticStatus` back after
navigating away. Bumping it turned out to need an effect rather than the
render-time branch above it - `react-hooks/refs` rejects touching a ref
in the render body itself, even through a wrapping `useCallback`, which
the render-time state adjustments above it are exempt from because they
call `setState`, not a ref write. The effect's one-render lag is
harmless here, unlike the `set-state-in-effect` case earlier: nothing
renders from `requestIdRef`, so there is no stale frame for a delayed
write to cause.

Separately, `/code-review PR 52` also found `useJobTasks`'s
`updateJobTask` replaced a task's whole optimistic override with the
new call's `input` instead of merging onto it - not reachable today,
since `JobDetailTasksPanel` only ever sends `{ status }`, but a latent
defect in the exact reuse (`title`/`dueDate`) Decision 2's own comment
invites. Fixed by merging the new `input` onto any existing override
instead of replacing it outright.

A third review round found a confirmed `optimisticTaskOverrides` entry
was never cleared on success, only restored-or-deleted on failure - so
a later `reload()` triggered for an unrelated reason
(`createJobTask`/`deleteJobTask` succeeding, or a retry) would re-merge
a now-possibly-stale override onto fresh `GET` data forever. Today this
hook is the only writer of a task's status, so an override in practice
never actually drifts from what the server holds - but nothing enforces
that staying true, and the original doc comment's "nothing the server
could have changed" claim was stated as a permanent invariant rather
than a today-only one. Fixed by clearing every override once `reload`'s
own `GET` succeeds, whatever triggered it: a fresh load is a natural
point to stop carrying state it no longer needs, without touching the
still-correct choice to skip a reload after `updateJobTask`'s own
success. A new test reloads via an unrelated create and confirms the
fresh `GET`'s answer (deliberately different from the confirmed
override) wins.
