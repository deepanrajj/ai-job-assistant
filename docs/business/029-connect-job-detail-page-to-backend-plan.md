# Task 029 - Connect Job Detail Page To Backend Plan

Status: Completed

## Purpose

Make `/jobs/:jobId` load its job from `GET /api/jobs/{id}` instead of
searching the localStorage provider. Task 024 moved the jobs list onto
the API and task 026 moved the create form; this closes the last read
path in the jobs workflow and, by construction, fixes bug 004: once the
page fetches by route id, the id the list links to and the id the page
resolves are the same id.

The call already exists. `getJobById` shipped in task 020 and
`mapJobResponseToJob` in task 023. Three things decide this task
instead:

1. The page needs three failure states, not one. A missing job and a
   failed request are different answers and only one of them is worth
   retrying, and the frontend currently cannot tell them apart because
   `AppError` does not carry the HTTP status.
2. The API job is a `TJob`. The page renders a `TJobDetail`, which also
   carries notes, tasks, a timeline and saved AI insights. The backend
   has none of those, and all three tabs are other tasks.
3. Every mutation the page offers today writes to localStorage keyed by
   job id. Against a backend id those writes match nothing and do
   nothing, silently.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/029-connect-job-detail-page-to-backend.md`
- `tasks/bugs/README.md`, Retired section, for bug 004
- `docs/business/024-replace-mock-jobs-on-jobs-list-page-plan.md`
- `docs/business/026-connect-add-job-form-to-backend-plan.md`

## Current State

### How the detail page gets its job today

```text
jobDetailRoute.tsx   useParams() -> jobId; useJobs() -> jobs + 9 writers
JobDetailPage        jobs.find(job => job.id === jobId)
JobsProvider         jobs come from localStorage, seeded from mock data
```

`JobDetailPage` is presentational apart from that `find`. It takes
`jobId`, `jobs`, and nine action props, and renders a not-found
`ErrorState` when the find misses.

Since task 024 the list renders backend UUIDs, so every row's details
action lands on that not-found state. The page is reachable only by
typing a seeded `job-001` style id by hand. That was bug 004, retired
into this task.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API call | `getJobById`, path-encoded, from task 020 |
| response to UI model | `mapJobResponseToJob` from task 023 |
| async state | `useAsyncMutation`, with request-id race guarding |
| a precedent for a feature hook over it | `useJobsList` from task 024 |
| a second precedent, for a 2xx carrying no entity | `useCreateJob` |
| loading and error surfaces | `LoadingState`, `ErrorState` |
| a localized failure message | `jobs.fallbackError.getJob` |
| UUID-shaped fixtures | `createMockJobResponse`, `MOCK_JOB_IDS` |
| a `TJob` to `TJobDetail` adapter | inside `createJobDetailFromJob` |

### Verified before writing this plan

Three claims below were checked rather than remembered.

**The backend answers 404 for an unknown job and 400 for an id that is
not a UUID.** `JobController.getJob` declares `@PathVariable id: UUID`,
so conversion fails during argument resolution, before the handler runs.
`ApiExceptionHandler.handleRequestParameterTypeMismatch` turns that into
400 `INVALID_REQUEST_PARAMETER`, and its own comment says the
`/jobs/{id}` segment is the case it exists for. Both are pinned by
existing backend tests: `returns not found when the service reports a
missing job` asserts 404 with `JOB_NOT_FOUND`, and `returns bad request
when the get path id is not a uuid` asserts 400 with
`INVALID_REQUEST_PARAMETER`. No probe was needed; the tests are the
evidence.

**Nothing in the frontend reads `AppError.code`.** A grep across
`frontend/src` for `.code` outside the `APP_ERROR_CODES` constant
returns one hit, the assignment in `appError.ts`. So this task is the
first consumer of error classification, and the classification is free
to be designed rather than worked around.

**Every mutation affordance on the detail page is already conditional on
its handler.** Read from the components: the notes panel renders its
create form inside `{onCreateNote && ...}` and each note's save and
delete buttons inside their own handler checks; the tasks panel gates
its create form on `onCreateTask` and its checkbox on `onToggleTask`;
the header gates the edit and delete buttons on `onEditJob` and
`onDeleteJob`. Two controls are **not** gated: the header's status
`Select`, which always renders and calls `onStatusChange?.()`, and the
AI panel's analyze button, which calls the AI endpoint itself and only
needs `onAnalyzeJob` to persist the result.

### What the edit route does with a backend id

`jobEditRoute` reads `useJobs()` and `EditJobPage` runs the same
`jobs.find(...)` against localStorage. A backend UUID misses, so the
edit page renders its own not-found state. Read from the files, not
assumed. Task 027 fixes it.

## Decisions

### Decision 1: `AppError` carries the HTTP status

`AppError` gains an optional `status`, and `createApiError` sets it from
the failed response. `createRequestError`, which is what a network
failure or a non-JSON body produces, leaves it undefined.

The page needs to tell "no such job" from "the request failed", and
nothing in the current error model can. Status is the transport fact,
it exists on every response, it needs no registry, and the next two
tasks want it too: a 404 from `PUT` or `DELETE` means the job is gone,
which is a different message from a 500.

**Rejected: map the backend's `code` field onto `AppError.code`.** The
API does send `JOB_NOT_FOUND`, and `AppError.code` already exists to
hold a classification, so this is the tempting one. It needs a
per-endpoint map of backend codes to app codes threaded through
`IApiErrorOptions`, and it only works when a response carries a parsable
body in the backend's error shape. A proxy 404, a 502 from Nginx with an
HTML body, or a gateway timeout has no `code`, and those are exactly the
failures the error state exists for. Status is present in all of them.

**Rejected: a dedicated `JOB_NOT_FOUND` app error code chosen inside
`getJobById`.** The service does not see the response either; only
`createApiError` does. This is decision 1 with a longer path.

### Decision 2: a `useJobDetail(jobId)` hook in `features/jobs`

Mirrors `useJobsList`: wraps `useAsyncMutation(getJobById)`, loads on
mount, re-loads when the id changes, and exposes `reload`.

| Member | Type | Purpose |
| --- | --- | --- |
| `job` | `TJobDetail \| null` | the mapped job, or null |
| `isLoading` | `boolean` | `isIdle \|\| isLoading`, as in `useJobsList` |
| `isNotFound` | `boolean` | the job does not exist |
| `error` | `AppError \| null` | a failure worth retrying |
| `reload` | `() => void` | retry, and the mount effect |

`isIdle` is folded into loading for the same reason as `useJobsList`:
the request starts in an effect, so the first render would otherwise
show the not-found state for a job that is about to arrive.

It lives beside `useJobsList` and `useCreateJob` in `features/jobs`
because all three wrap the same service and because the `TJob` to
`TJobDetail` adapter already lives in that folder.

**Rejected: `features/jobDetail/useJobDetail.ts`.** The consuming
feature owns it, which reads well until the adapter, the service and the
two sibling hooks are all one folder over. Tasks 027 and 028 add
`useUpdateJob` and `useDeleteJob`; keeping the set together is what
makes the migration legible.

**Rejected: fetching inside `JobDetailPage`.** See decision 3.

### Decision 3: the route owns the hook, the page stays presentational

`jobDetailRoute` already reads `useParams`. It calls `useJobDetail(jobId)`
and passes `error`, `isLoading`, `isNotFound`, `job` and `onRetry` down,
exactly as `jobsRoute` does for `JobsPage`.

This is the opposite of task 026, where `NewJobPage` owns its hook, so
it needs a reason rather than an assumption. `NewJobPage` owns a form
state machine, and the request is one step inside a submit handler it
already owns. `JobDetailPage` owns nothing: it finds a job and renders
three components, and its tab state lives inside `JobDetailTabs`. Making
it fetch would force MSW into all six of its existing cases to assert
anything about rendering, which is the reason task 024 gave for leaving
`JobsPage` presentational.

### Decision 4: not-found covers 404 and a 400 on the id

```ts
const isNotFound = error?.status === 404 || error?.status === 400;
```

404 is the obvious half. The 400 is the bug 004 case: a stale link, a
bookmark, or a seeded `job-001` id is not a UUID, so the backend rejects
it during argument resolution. To the user, `/jobs/job-001` is a job
that does not exist.

`GET /api/jobs/{id}` takes exactly one parameter, so a 400 from it can
only be about the id. The mapping is made in the hook that knows the
endpoint, not in the shared client.

**Rejected: 404 only, everything else is a load error.** A malformed id
would then render "could not be loaded" with a Try again button that
can never succeed, on the single most likely way to arrive at a dead
link.

### Decision 5: a 2xx carrying no job is a load error, not a missing job

`getJobById` casts the body without validating it, and
`parseJsonResponse` resolves a 204 as `undefined`. The hook checks
`response?.id` and records an `AppError` when it is absent.

This is the defect the second review of task 026 found, in the same
shape, and `useCreateJob` already guards it this way. It is a load
error, not a not-found: the server said the job exists and then sent
nothing, which is a broken response and worth retrying. A not-found
state would state something the server did not say.

### Decision 6: the API job is adapted through a shared mapper

`features/jobs/jobs.utils.ts` gains `mapJobToJobDetail(job: TJob)`,
filling the fields `TJobDetail` requires and `TJob` leaves optional
(blank strings, zero salaries) and giving the four collections their
empty values. `createJobDetailFromJob` in `jobsStore.utils.ts` is
rebuilt on it, adding only the "Job saved" timeline event the local
store mints on save, so the store's behaviour does not move.

This is the shape task 026 used for `createJobFormFields` and
`createJobFormPayload`, for the same reason: one set of conversion rules
with one caller adding what only it needs.

**Rejected: reuse `createJobDetailFromJob` as it stands.** It
fabricates a "Job saved" timeline event from the job's own timestamp.
For a locally created job that event is a record of something that
happened. For a job fetched from the backend it is invented history on
a tab whose data source is task 032.

### Decision 7: the page offers no control it cannot honour

The route stops passing the nine localStorage writers, so the detail
page becomes a read-only view of backend job data. Two controls need a
guard because they are not gated on their handler:

- `JobDetailHeader` disables the status `Select` when `onStatusChange`
  is absent.
- `JobDetailAiPanel` disables the analyze button when `onAnalyzeJob`
  is absent.

The page also stops passing `onEditJob`, because the edit route still
resolves ids against localStorage and would answer "Job not found" for
every backend job until task 027.

**Rejected: keep passing the provider's writers.** Each one maps over
the stored jobs looking for the route id. A backend UUID matches
nothing, so every one returns the list unchanged: the status select
snaps back, Add note clears the textarea and shows no note, the delete
button navigates away having deleted nothing. Nine silent no-ops is the
exact defect class the last two reviews of task 026 caught, multiplied.

**Rejected: connect status, delete or edit here.** Tasks 027 and 028
own them, and `AGENTS.md` section 2 makes the task file the boundary.

**Rejected: leave the analyze button enabled.** It calls the paid
provider through `/api/ai/analyze-job` and hands the result to
`onAnalyzeJob?.()`, which is now absent, so the money is spent and the
result is dropped without anything rendering.

The AI panel keeps its own request state and error alert, so nothing
about that tab's structure changes; the button is disabled with the same
`disabled` prop it already uses for an empty description.

### Decision 8: the not-found copy is corrected, and two keys are added

`jobDetail.notFoundDescription` reads "The selected job does not exist
in the saved local tracker data." That sentence stops being true in this
change, and copy that describes a removed mechanism is bug 003 exactly.
It becomes a statement about the job, not about where it was looked for.

New keys: `jobDetail.loading` and `jobDetail.loadErrorTitle`, in `en`
and `de`.

The retry button reuses `jobs.loadErrorRetry` ("Try again"). It is a
generic action label with identical meaning on both screens, and two
copies of one word are two things to keep in step for no gain. This is
not the bug 003 case, where one *title* was made to describe two
unrelated failures.

### Decision 9: the remaining divergence is recorded, not papered over

After this task the detail page reads the backend. The dashboard still
reads localStorage until task 025, editing and deleting a fetched job
are tasks 027 and 028, and the tasks, notes and timeline tabs render
empty until tasks 030 to 032. The timeline card is the one visible
change to a tab: a fetched job has no events, where a locally created
job always had one.

Empty notes and tasks cards are not new. A job created through the local
store has always rendered both empty, because `createJobDetailFromJob`
gives them empty arrays.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobs/useJobDetail.ts` | the hook from decision 2 |
| `frontend/src/features/jobs/useJobDetail.test.tsx` | its test, against MSW |

### Changed files

| File | Change |
| --- | --- |
| `errors/appError.ts` | optional `status` |
| `services/api/api.utils.ts` | `createApiError` sets `status` |
| `features/jobs/jobs.utils.ts` | add `mapJobToJobDetail` |
| `features/jobs/jobsStore.utils.ts` | rebuild `createJobDetailFromJob` on it |
| `features/jobs/index.ts` | export `useJobDetail` |
| `features/jobDetail/components/JobDetailHeader.tsx` | disable the status select without a handler |
| `features/jobDetail/components/JobDetailAiPanel.tsx` | disable analyze without a handler |
| `pages/jobDetail/JobDetailPage.tsx` | new props, three states, no writers |
| `routes/modules/jobDetailRoute.tsx` | own the hook, drop `useJobs` |
| `i18n/locales/en.json`, `de.json` | two new keys, one corrected |

`JobDetailPage` props become `error`, `isLoading`, `isNotFound`, `job`
and `onRetry`. `jobId` and `jobs` are gone, as are the nine actions.

State order in the page: loading, then not found, then error, then the
job. Not found is checked before error because a 404 sets both.

## Tests

### New: `useJobDetail.test.tsx`

Follows `useJobsList.test.tsx`: a small probe component, MSW handlers
per test because `setupTests.ts` errors on unhandled requests.

| Case | Asserts |
| --- | --- |
| loads and maps the job | the probe renders the company, and a null wire field arrives as undefined |
| a 404 is not found | `isNotFound`, and `job` is null |
| a non-UUID id is not found | a 400 gives the same answer |
| a 500 is a load error | `error` is set and `isNotFound` is false |
| a 2xx with no job is a load error | a 204 sets `error` rather than rendering nothing |
| a new id refetches | changing the prop renders the second job |
| reload retries | 500 then 200, and the job appears |

### Changed: `JobDetailPage.test.tsx`

The page no longer accepts `jobId`, `jobs` or the nine writers, so the
cases that asserted delete, status change and note content cannot be
expressed against it. They are not weakened, they move: the header's
own test already covers both the handler-present and handler-absent
cases, and each panel test passes its handlers directly.

| Case | Asserts |
| --- | --- |
| renders the job from props | heading, company, metadata |
| renders the loading state | `role="status"` while loading |
| renders not found | `role="alert"` with "Job not found", and back to jobs works |
| renders the load error | the message and a Try again that calls `onRetry` |
| tabs still switch | every tab reachable, `aria-selected` follows |
| offers no write it cannot perform | no edit or delete button, no add-note form, and the status select is disabled |

### Changed: `jobDetailRoute.test.tsx`

Now fetches. Gains MSW handlers and a case per route-level state, plus
the handoff the task file asks for: render the jobs route and the detail
route in one memory router, click a row's details action, and assert the
detail heading for that row's job. It must not show "Job not found".
Fixtures come from `createMockJobResponses`, whose ids are UUIDs.

### Changed: `JobDetailHeader.test.tsx`, `JobDetailAiPanel.test.tsx`

One case each for the newly guarded control.

### Changed: `jobs.utils.test.ts`, `apiClient.test.ts`

`mapJobToJobDetail` fills the optional fields and empties the
collections. `createApiError` records the status, and a network failure
leaves it undefined.

### Unchanged and used as proof: `jobsStore.utils.test.ts`

The store rebuild in decision 6 must leave it passing untouched. If it
moves, the rebuild changed behaviour it should not have.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add `status` to `AppError` and set it in `createApiError`, with
   tests. Nothing else changes yet; the whole suite must stay green.
3. Add `mapJobToJobDetail` and rebuild `createJobDetailFromJob` on it.
   Run `jobsStore.utils.test.ts` and `JobsProvider.test.tsx` before
   anything else. Both must pass untouched.
4. Add `useJobDetail` and its test. Expect the 2xx-with-no-job case to
   be the fiddly one: it has to record an error from a resolved
   promise, which is decision 5 arriving in the test before the page.
5. Rewrite `JobDetailPage` for the new props. Run its test **before**
   touching it: every case must fail to compile against the removed
   props. That failure is the proof the page no longer reads the store.
6. Rewrite the page's cases, then the route, then its cases.
7. Guard the two controls in decision 7, with a case each. Check the
   status select case fails first with the guard removed.
8. Correct the not-found copy and add the two keys, in both locales.
9. `npm run frontend:verify`.
10. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/features/jobs/useJobDetail.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/pages/jobDetail/JobDetailPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend file changes and no
contract change, so `AGENTS.md` section 3 asks for the app-level check
for the app that changed, and the Postman collection needs no edit. The
task file's own validation line is `npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No dashboard, edit, or delete migration. Tasks 025, 027 and 028.
- No tasks, notes, or timeline backend integration. Tasks 030 to 032.
- No new empty-state copy for the tabs those tasks own.
- No removal of any `JobsProvider` member. It still serves the
  dashboard and the edit route.
- No new library, and no data-fetching library, per
  `frontend/AGENTS.md` section 5.
- No `useAsyncQuery` extraction. Task 024 deferred it until a second
  caller exists and its shape is known. This is that second caller, but
  the extraction is a refactor of `useJobsList` as well, and
  `AGENTS.md` section 0 rules out drive-by refactors. Worth a task of
  its own once 027 and 028 show whether the shape holds.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/029-connect-job-detail-page-to-backend.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Move bug 004 from Retired to Fixed in `tasks/bugs/README.md`, since
  the fix it was retired into has shipped.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- Update `docs/context.md` section 3, which lists the job detail page
  among the screens still reading localStorage.

## Acceptance Criteria

- [x] Job detail renders data from `GET /api/jobs/{id}`.
- [x] A missing job and a malformed id both render the not-found state,
      with no retry offered.
- [x] A failed request renders the load error state with a working
      retry.
- [x] The loading state renders while the request is in flight.
- [x] Tabs keep their roles, selection state, and keyboard behaviour.
- [x] A row's details action on the jobs list opens that job's detail
      page.
- [x] No control is rendered enabled that cannot complete.
- [x] `npm run frontend:verify` passes.

## Verified State

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 112 test
files and 277 tests, 100 per cent of lines (961/961) and functions
(406/406), production build fine.

Branch coverage is 98.03 per cent. The two files below it,
`jobsStore.utils.ts` and `NewJobPage.tsx`, were already there before this
change; nothing added here is uncovered.

### What was built

`useJobDetail` loads the job for the route id, `jobDetailRoute` owns it,
and `JobDetailPage` renders loading, not-found, load-error, or the job.
`AppError` carries the response status, which is what lets one endpoint
answer a missing job and a failed request differently.
`mapJobToJobDetail` widens an API job into the detail shape, and
`createJobDetailFromJob` is rebuilt on it. The page is read-only, and
the two controls that were not already gated on their handler now
disable without one.

### Failures observed deliberately

Five, each run before the code that fixes it.

- The six existing `JobDetailPage` cases all failed once the page stopped
  reading the store. That is the proof it really fetches.
- `reports an id that is not a uuid as not found` failed with 400
  removed from `NOT_FOUND_STATUSES`, at "Unable to find not found".
- `reports a 2xx that carries no job as a failure` failed with the
  response guard disabled, at "Unable to find /^error:/", because the
  probe rendered no job, no error and nothing loading. That is the same
  defect the second review of task 026 found in `useCreateJob`.
- `offers no write it cannot complete` failed before the status select
  was disabled, at "Received element is not disabled".
- `opens the job a jobs list row links to` failed against a route that
  ignored its param, at "Unable to find Senior Product Engineer". That
  is bug 004 reproduced, and the case that closes it.

The store rebuild was checked the other way round:
`jobsStore.utils.test.ts` and `JobsProvider.test.tsx` passed untouched
before anything else changed.

### Changed from the plan

One file the plan did not list: `routes/paths.test.ts` is new.
`APP_PATH_BUILDERS.jobEdit` lost its only caller when the page stopped
offering an edit button, which took line coverage off 100 per cent. The
member stays, because task 027 needs it and removing one mid-migration
is the drive-by refactor `AGENTS.md` section 0 rules out, so it is
covered by a test that pins both builders and the id encoding.

`JobDetailAiPanel.test.tsx` lost `can analyze without a parent save
callback`, which asserted the behaviour decision 7 deliberately removes,
and gained one asserting the button is disabled instead. The failure
case in the same file now passes `onAnalyzeJob`, since analysis is only
offered when the result has somewhere to go.
