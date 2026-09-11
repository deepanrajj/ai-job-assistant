# Task 024 - Replace Mock Jobs On Jobs List Page Plan

Status: Completed

## Purpose

Make the jobs list read from `GET /api/jobs` instead of the
localStorage provider. This is the first screen in the application to
render backend data, and the first time the service from task 020 and
the mapper from task 023 have a caller.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/024-replace-mock-jobs-on-jobs-list-page.md`
- `docs/business/020-add-job-service-plan.md`
- `docs/business/023-add-typed-api-response-models-plan.md`
- `docs/business/e2e-testing-strategy-plan.md`

## Current State

### How the list gets its data today

Three thin layers, none of which touch the network:

```text
jobsRoute.tsx    const { jobs } = useJobs()      -> <JobsPage jobs={jobs} />
JobsProvider     useState(readStoredJobs(localStorage))
JobsPage         presentational; takes jobs: TJob[], renders <DataTable>
```

`JobsPage` holds every behaviour the task says to preserve: search,
status filter, sort, the summary line, the empty state, and the add-job
action. It receives `jobs` as a prop and owns no fetching. That is worth
keeping.

Route modules in this codebase are deliberately thin. `dashboardRoute`,
`jobDetailRoute` and `jobsRoute` all read context and pass props down,
and their tests are three lines each.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API call | `getJobs()` from task 020, typed to `TJobResponse[]` |
| wire to UI model | `mapJobResponseToJob` from task 023 |
| loading UI | `LoadingState`, `role="status"`, `aria-busy` |
| error UI | `ErrorState`, `role="alert"`, optional action slot |
| async state | `useAsyncMutation`, with request-id race guarding |
| a localized failure message | `jobs.fallbackError.listJobs` |

So this task is wiring, not construction. Tasks 033 and 034 are titled
"add loading states" and "add error states", but the components they
imply already exist and the task file for 024 says to use them, so
nothing here pre-empts those.

### The provider is not just the list

`JobsProvider` backs the dashboard, the job detail page, and every task,
note, timeline and AI mutation. `useJobs()` returns twelve members.
Replacing its internals would reach far outside this task.

## Decisions

### The list gets its own hook; `JobsProvider` is not touched

A new `useJobsList` in `features/jobs`, calling `getJobs` and mapping
the result. `jobsRoute` calls it instead of `useJobs()`. Everything else
keeps reading the provider.

**Rejected: make `JobsProvider` fetch from the API.** It is the obvious
move and it is wrong for three reasons. The provider stores
`TJobDetail`, which carries tasks, notes, timeline and AI insights that
no endpoint returns yet. Its twelve mutations all write locally, and
this task puts create, update and delete out of scope. And the job
detail page would start rendering half-empty records. That change
belongs to task 029, which owns the detail page, after 026 to 028 have
moved the writes.

**Rejected: fetch inside `JobsPage`.** It would make the page test
require MSW for every existing search and filter case, which currently
pass plain arrays. Keeping `JobsPage` presentational is what lets the
preserved behaviour stay proven by the tests that already prove it.

### The transitional inconsistency is accepted and recorded

After this task the jobs list shows backend data while the add, edit and
delete forms still write to localStorage, and the dashboard still reads
localStorage. So a job created in the UI will not appear in the list,
and the dashboard count will disagree with the list.

This is inherent to the ordering, not a defect introduced here. Task 026
closes the create half and 027, 028 and 025 close the rest. The window
is real and worth stating plainly rather than discovering at 026.

**Rejected: keep a localStorage fallback so the list looks consistent.**
Merging local and remote jobs would mean inventing a reconciliation rule
nobody has specified, and it would hide exactly the breakage that tells
us 026 is needed next.

### `useAsyncMutation` is reused rather than a query hook added

The hook is a mutation hook, but a list fetch is the same state machine
with a different trigger. `useJobsList` calls `mutate` from an effect on
mount.

Read from `useAsyncMutation.ts` rather than assumed:

- `mutate` is wrapped in `useCallback` with `[mutationFn]` as its only
  dependency. `getJobs` is a module-level import, so its identity is
  stable and an effect keyed on `[mutate]` runs once. No render loop.
- `mutate` **rethrows** on failure, so the effect must attach a `catch`.
  Without one the rejection is unhandled even though the hook has
  already recorded the error. `AnalyzeJobPage` handles this with a
  `try`/`catch` for the same reason.
- The initial status is `idle`, not `loading`, because
  `createInitialMutationState` returns `idle`. So the first paint is
  neither loading nor loaded. `useJobsList` therefore reports
  `isLoading` as `isIdle || isLoading`, otherwise the empty table
  flashes for one frame before the request starts.

**Rejected: add a `useAsyncQuery` hook.** Tasks 025 and 029 to 032 will
all want fetch-on-mount, so a shared query hook is probably coming. It
should be extracted when the second caller exists and its shape is
known, not guessed from one. `AGENTS.md` §0 rules out speculative
abstractions, and the three points above are small enough to live in one
hook with one test.

**Rejected: React Router loaders.** `frontend/AGENTS.md` §5 allows them,
and they would move fetching out of the component. They also change how
every jobs test renders, and they make the loading state a router
concern rather than a component one. Too large a change to smuggle into
a task scoped to one screen.

### `JobsPage` renders the three states, the route stays thin

`JobsPage` gains `error` and `isLoading` props and returns `LoadingState`,
`ErrorState`, or the existing `DataTable`.

This keeps the route module the same shape as its two siblings, and it
means the three states are testable by passing props, with no network
stub. The task file asks for "page/component tests for loading, success,
and error states" and this is what makes those cheap.

Both props are **required**, not optional with defaults. Optional would
let a future caller forget them and silently render a permanent empty
table. Two existing call sites need updating and the compiler will name
both.

### The error message comes from the thrown `AppError`, with a fallback

`getJobs` already rejects with an `AppError` whose message is either the
backend's or the localized `jobs.fallbackError.listJobs`. `JobsPage`
renders `error.message`.

**Amended after review.** The original decision here read "Rejected: a
second translation key for a list-load failure", on the grounds that task
020's five fallback keys already own that text. The implementation then
shipped `jobs.loadErrorTitle` anyway, and the contradiction survived into
the first verified-state section unnoticed.

Keeping the title, and correcting the decision rather than the code:
`ErrorState` requires a `title`, so the only way to honour the original
wording would be to pass `error.message` as the title and leave the
description empty, which reads worse. The service's message stays the
description, so the two strings play different roles rather than
duplicating one. What the original decision was right about is that a
*second message* would drift; a title is not a second message.

### A retry action on the error state

**Reversed after review.** This section originally rejected a retry
button and deferred it to task 034. The review showed the deferral makes
the error branch a dead end: the early return replaces the whole page,
including the only route to "Add job", so a single 500 leaves the user
with no affordance at all and no recovery short of a browser reload.

`useJobsList` now returns `reload`, and `JobsPage` passes it as
`ErrorState`'s `action`. The trap worth recording is the obvious
implementation: exposing `useAsyncMutation`'s `reset` instead would set
status back to `idle`, and `idle` is reported as loading here, so the
page would show a spinner forever with no request in flight. `reload`
calls `mutate` again, which goes straight to `loading`.

The open question the original decision raised, whether a retry clears
the previous data, is answered by `useAsyncMutation` rather than by this
hook: `mutate` sets `data: null` when it starts, so a retry always clears.

## Proposed Change

New:

| File | Holds |
| --- | --- |
| `features/jobs/useJobsList.ts` | the hook: fetch, map, state |
| `features/jobs/useJobsList.test.tsx` | mount fetch, success, error |

Edited:

| File | Change |
| --- | --- |
| `features/jobs/index.ts` | export the hook |
| `routes/modules/jobsRoute.tsx` | call `useJobsList`, pass three props |
| `pages/jobs/JobsPage.tsx` | `error` and `isLoading` props, three branches |
| `i18n/locales/en.json`, `de.json` | one loading label |

Hook shape:

```ts
useJobsList(): { error: AppError | null; isLoading: boolean; jobs: TJob[] }
```

`jobs` is `[]` until the request resolves, so `JobsPage` never receives
`null` and the `DataTable` contract is unchanged.

Five new translation keys per locale: `jobs.loading` for the
`LoadingState` label, `jobs.loadErrorTitle` and `jobs.loadErrorRetry` for
the error state, and `jobs.noJobsYet` plus `jobs.noJobsYetDescription`
for the first-run empty state. The error *message* still comes from the
service.

## Tests

### `useJobsList.test.tsx`

Against MSW, adding a `GET /api/jobs` handler to `src/test/handlers.ts`:

- resolves to mapped jobs, asserting a `null` from the wire arrives as
  `undefined` so the mapper is actually in the path
- reports loading before the response and not after
- records the `AppError` on a 500 and leaves `jobs` empty
- the request fires once on mount

The last one earns its keep: an effect whose dependency identity is not
stable would loop, and a loop is invisible in a test that only asserts
the final state.

### `JobsPage.test.tsx`

Three additions, all by props:

- `isLoading` renders the loading region, found by `role="status"`
- `error` renders the alert with the error's message
- loading takes precedence over an error from a previous attempt

Existing search, filter and navigation cases keep passing arrays and are
otherwise untouched. That is the evidence for "existing table behaviour
is preserved".

### `jobsRoute.test.tsx`

Updated to render under MSW rather than the provider, asserting the
table appears once the request resolves.

## Implementation Order

1. **MSW handler for `GET /api/jobs`.** Nothing to run yet.
2. **`useJobsList` and its test.** Expected failure if the effect
   dependency is wrong: the "fires once" case sees more than one call.
3. **`JobsPage` props and branches.** Expected failure: `tsc` names both
   call sites, the route module and the page test, because the props are
   required.
4. **`jobsRoute`.** Expected failure: its existing test renders without
   MSW and now gets an empty table, which is the prompt to update it.
5. **Translations, both locales.** A missed key surfaces as the raw key
   string in the loading assertion, not as a silent pass.
6. **Barrel export.** Last.

## Verification Plan

```bash
npm run frontend:test:coverage
```

```bash
npm run frontend:verify
```

`npm run verify` is not required; nothing under `backend/` changes.

Every test here stubs the network at MSW, so none of them proves the
real endpoint answers in this shape. Task 020 verified that against a
running stack, and task 080's browser journey is the first thing that
will prove it end to end. Worth one manual check against
`npm run dev:compose` before this is called done, since this is the
first screen that renders backend data.

## Scope Boundaries

In scope:

- The jobs list route reading `GET /api/jobs`.
- Loading and error rendering on that one page.
- Tests for those three states.

Out of scope:

- `JobsProvider`, and every other screen that reads it.
- The dashboard. Task 025.
- Create, edit and delete. Tasks 026 to 028.
- The job detail page. Task 029.
- A retry affordance.
- A shared query hook.
- A data-fetching library. `frontend/AGENTS.md` §5.
- The stale `jobs.searchPlaceholder` copy. It still offers to search by
  "skill" after task 023 removed tags from the search text. Filed as
  bug 003 rather than fixed here, per `tasks/bugs/README.md`.

## Completion Rules

- `npm run frontend:verify` passes.
- Task 024 criteria ticked and status set.
- `docs/backlog/phase-4-frontend-backend-integration.md` updated, with
  the recommended-next-task line moved to 026 per the accelerated
  ordering.
- `docs/business/README.md` links this plan.
- Bug 003 filed and listed in `tasks/bugs/README.md`.
- This plan marked `Completed` with a verified-state section.
- No commit or push without being asked.

## Acceptance Criteria

- [ ] Jobs list uses backend data.
- [ ] Existing table behavior is preserved.
- [ ] Tests cover user-visible states.

## Verified State

### What was built

One hook, three rendered states, and two fixtures. `JobsProvider` is
untouched, which is what keeps this task inside its scope.

| File | Change |
| --- | --- |
| `features/jobs/useJobsList.ts` | new: fetch on mount, map, expose state |
| `features/jobs/useJobsList.test.tsx` | new: 4 cases |
| `pages/jobs/JobsPage.tsx` | `error` and `isLoading` props, three branches |
| `routes/modules/jobsRoute.tsx` | calls the hook instead of `useJobs` |
| `test/mockJobs.ts` | `createMockJobResponse`, `createMockJobResponses` |
| `test/handlers.ts` | default `GET /api/jobs` handler |
| `i18n/locales/*.json` | `jobs.loading`, `jobs.loadErrorTitle` |

### What the verification reported

| Check | Result |
| --- | --- |
| `npm run frontend:verify` | exit 0 |
| tests | 244 passing across 109 files, 8 new |
| coverage | 99.61 statements, 98.11 branches, unchanged from main |

### Checked against a running stack, not only MSW

The plan committed to this because every automated test here stubs the
network, so none of them proves the real endpoint answers in this shape
or that the Nginx proxy passes it through. Run against
`npm run dev:compose` with two jobs created through the API.

| Question | Answer |
| --- | --- |
| does the list render backend rows | yes, both, "2 of 2 opportunities shown" |
| does a wire `null` survive the mapper | yes: the null-heavy row shows "Not set" for location and salary |
| does a populated row render fully | yes: Munich, EUR 76k - EUR 92k, and an Open posting link |
| does search still filter | yes, "personio" narrows to 1 of 2 |
| does the loading state appear | yes, while the request is in flight |
| does the error state appear | yes, after stopping the backend |

The error case is the one worth recording. With the backend stopped,
Nginx answers 502 after roughly three seconds, so the page holds the
loading state for that long and then renders the alert with
"Saved jobs could not be loaded" over the service's own
"Failed to load jobs". A first read of the page before the 502 landed
showed only the loading state, which looked like a stuck spinner and was
not one.

### The transitional inconsistency is now real

As the plan predicted, the list reads the backend while the add, edit
and delete forms still write to localStorage, and the dashboard still
reads localStorage. A job created in the UI does not appear in the list.
This is the ordering working as intended and it closes at task 026.

### Filed rather than fixed

`jobs.searchPlaceholder` still offers to search by "skill" in both
locales, which task 023 invalidated when it removed tags from the search
text. Filed as bug 003; the placeholder is visible in the screenshot
taken during this task's manual check.

## Review Fixes

A max-effort review of pull request #22 raised fifteen findings. Fourteen
were applied on the branch; one was filed.

### Applied

| Area | Change |
| --- | --- |
| `apiClient.ts` | `return await parseJsonResponse(...)`. Without the `await`, a parse failure on a 2xx escaped the `try` and reached the UI as a raw `SyntaxError` instead of an `AppError` |
| `useJobsList` | `Array.isArray` guard, so a 2xx carrying an object no longer throws during render past this hook's own error state |
| `useJobsList` | explicit `useAsyncMutation<void, TJobResponse[]>`, because a zero-argument `getJobs` gave `TArgs` no inference site and it fell back to `unknown` |
| `useJobsList` | `reload`, wired to `ErrorState`'s action slot |
| `JobsPage` | a first-run empty state, so an empty database no longer tells the user to adjust filters they never set |
| fixtures | wire ids are UUIDs and timestamps carry an offset, matching what the backend really sends |
| fixtures | `createMockJobs` derives from `createMockJobResponses` through the production mapper, so the two cannot drift |
| `handlers.ts` | the jobs handler moved out of the shared defaults into the one test that needs it, keeping `onUnhandledRequest: 'error'` meaningful |
| tests | the loading case now holds the response open and asserts the transition; it previously passed even with the fetch deleted |
| tests | the request-count case settles before asserting; `waitFor` resolves on its first pass and could never see a later request |
| tests | added the zero-jobs success case and a StrictMode case |
| `docs/context.md` | records the new data source and what still reads localStorage |
| this plan | two decisions corrected above, where the code had diverged from them |

### Filed, not fixed

The review found that **every row's details action leads to "Job not
found"**, because the list renders backend UUIDs while the detail page
still resolves ids against localStorage. This is worse than the
divergences recorded above: it needs no user action and it breaks a
control on the page this task ships.

It is not fixed here because the honest fix is task 029's scope. The
detail page needs a `TJobDetail`, carrying tasks, notes, timeline and AI
insights that no endpoint returns, and its mutation callbacks all write
locally, so a partial move would trade a visible dead link for silently
no-op note and task creation. Filed as bug 004 with three candidate
approaches.

Bug 004 has since been retired rather than fixed on its own. Task 029
closes it by construction, so the ticket was removed and what it knew -
the defect, the handoff test, and the warning about UUID-shaped
fixtures - moved into that task file. The defect itself is unchanged
and still live until task 029 ships. See `tasks/bugs/README.md`.
