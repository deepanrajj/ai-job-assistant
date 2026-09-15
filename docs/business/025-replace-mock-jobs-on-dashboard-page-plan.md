# Task 025 - Replace Mock Jobs On Dashboard Page Plan

Status: Completed

## Purpose

Make the dashboard derive its metrics, status meters, and recent
activity from `GET /api/jobs` instead of the localStorage provider.

The dashboard is the last screen reading that provider, so this task
also settles what happens to it. Tasks 024 and 026 to 029 moved the
jobs list, the add and edit forms, the delete action, and the job
detail page onto the backend one at a time, each leaving the provider
in place because another screen still needed it. After this route
switches, nothing does.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/025-replace-mock-jobs-on-dashboard-page.md`
- `docs/business/024-replace-mock-jobs-on-jobs-list-page-plan.md`
- `docs/business/029-connect-job-detail-page-to-backend-plan.md`
- `docs/backlog/phase-4-frontend-backend-integration.md`

## Current State

### How the dashboard gets its data today

```text
dashboardRoute.tsx  const { jobs } = useJobs() -> <DashboardPage jobs={jobs} />
JobsProvider        useState(readStoredJobs(window.localStorage, KEY))
DashboardPage       useMemo(getDashboardData(jobs)) -> three components
```

`DashboardPage` is presentational and owns no fetching. It derives
everything through one call to `getDashboardData`, which returns
`activeJobCount`, `recentJobs`, `statusCounts`, and `totalJobCount`.
Those four values feed `DashboardMetrics`, `DashboardStatusOverview`,
and `DashboardRecentActivity`.

This is the same shape task 024 found on the jobs list, so the same
answer fits: keep the page presentational, move the request into the
route.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API call and mapping | `useJobsList`, from task 024 |
| loading UI | `LoadingState`, `role="status"`, `aria-busy` |
| error UI | `ErrorState`, `role="alert"`, optional action slot |
| a retry label | `jobs.loadErrorRetry`, reused by task 029 |
| dashboard derivation | `getDashboardData`, unchanged by this task |

`useJobsList` returns exactly what the dashboard needs: `TJob[]`,
`error`, `isLoading`, and `reload`. `getDashboardData` takes `TJob[]`.
So the wiring is one import change in the route plus three props on the
page.

### The provider is now the dashboard alone

Verified by searching the whole of `frontend/src` for `useJobs`,
`JobsProvider`, and `jobsStore.utils`:

| Symbol | Production callers outside the store itself |
| --- | --- |
| `useJobs` | `routes/modules/dashboardRoute.tsx` only |
| `JobsProvider` | `main.tsx`, `test/renderWithProviders.ts` |
| `jobsStore.utils` | `features/jobs/JobsProvider.tsx` only |

`jobsStore.types.ts` is the exception that shapes the removal. It holds
three interfaces, and one of them, `IUpdateJobTaskInput`, is still live:
`features/jobDetail/components/JobDetailTasksPanel.tsx` and
`features/jobDetail/jobDetail.types.ts` both import it. The other two,
`IJobsContextValue` and `IJobsProviderProps`, describe the provider.

`src/data/mockJobDetails.ts` is imported by `jobsStore.utils.ts` as the
seed for an empty or malformed store, and by ten job detail test files
as a fixture. Only the first use disappears here.

### What the store does while nothing reads it

`JobsProvider` seeds state from `readStoredJobs`, which returns
`mockJobDetails` when the key is missing, and an effect writes the whole
array back to `localStorage` on every state change. Mounted with no
reader, it still writes seeded demo jobs into every visitor's browser
on first load.

## Decisions

### Decision 1: the dashboard reuses `useJobsList`

`dashboardRoute` calls `useJobsList` and passes `error`, `isLoading`,
`jobs`, and `onRetry` down. No new hook.

**Rejected: a `useDashboardJobs` hook.** It would be `useJobsList`
with a different name. Both screens want the same request, the same
mapper, and the same `TJob[]`; the dashboard's extra step,
`getDashboardData`, already lives in `DashboardPage` behind a `useMemo`
and is not a fetching concern. `AGENTS.md` section 0 rules out
speculative abstractions.

**Rejected: extracting a shared `useAsyncQuery`.** Task 024 deferred
this until a second caller existed and task 029 deferred it again at
the second. This is the third, and the shape has held, so the
extraction is now justified on evidence rather than guessed. It is
still a refactor of `useJobsList`, `useJob`, and every test that covers
them, which `AGENTS.md` section 0 keeps out of a feature task. It wants
its own task file, not a quiet passenger in this one.

**Rejected: one shared fetch for both screens, through a provider or a
cache.** That is the provider this task removes, rebuilt with a
different backing store. Nothing renders the dashboard and the jobs
list at once, so the only thing shared would be a stale response.

**Consequence, recorded rather than fixed:** moving between the
dashboard and the jobs list now issues one `GET /api/jobs` per
navigation. There is no cache layer in the frontend and neither screen
is expensive, so this is the honest behaviour rather than a defect. It
is the shape a `useAsyncQuery` task would revisit.

### Decision 2: `DashboardPage` renders the three states from props

`DashboardPage` gains `error`, `isLoading`, and `onRetry`, and returns
`LoadingState`, `ErrorState`, or the existing dashboard body. This
mirrors `JobsPage` exactly, down to loading taking precedence over an
error from a previous attempt.

**Rejected: fetching inside `DashboardPage`.** Its two existing tests
pass plain arrays and assert metric values and meter ordering. Moving
the fetch in would make both of them set up MSW to prove arithmetic
that has nothing to do with the network.

**Rejected: optional props with defaults.** A caller that forgot them
would render a permanent all-zero dashboard, which looks like a working
screen with no saved jobs rather than a bug. Required props make `tsc`
name both call sites, the route module and the page test.

### Decision 3: an empty backend gets first-run copy on recent activity

`DashboardRecentActivity` maps `jobs` into list items inside a titled
`Card`. With zero jobs it renders a heading above an empty list: a card
with a border and nothing in it.

This could not happen before. `readStoredJobs` returns the seeded demo
jobs when the key is missing, so the dashboard has never once rendered
an empty list in the app. Against a real empty database it is the first
thing a new user sees.

The other two components are already correct at zero, verified by
reading them rather than assumed:

- `getStatusMeterWidth` returns `0%` when `totalJobCount` is 0, so
  there is no division by zero.
- `DashboardStatusOverview` passes `aria-valuemax` as
  `Math.max(totalJobCount, 1)` on each meter, so `role="meter"` keeps a
  valid range at zero.
- `DashboardMetrics` renders four zeroes, which is accurate.

So the fix is two translation keys and one branch in the activity card.

**Rejected: reusing `jobs.noJobsYet` and its description.** That copy
reads "Add your first opportunity to start tracking applications." on a
page whose empty table sits directly beneath an Add Job button. The
dashboard card has no such control, so the sentence would point at
nothing. This is the distinction task 029 drew when it reused
`jobs.loadErrorRetry`: a generic action label travels, a sentence about
a specific control does not.

**Rejected: deferring it to task 033 or 034.** Those tasks cover
loading and error states for API screens. An empty database is a
successful response, so neither would pick it up, and the gap would
reach a user first.

**Rejected: an empty state on the whole dashboard.** The metrics and
meters are meaningful at zero, and a new user should see the shape of
the screen they are filling in.

### Decision 4: the localStorage store is retired in this task

Deleted: `features/jobs/JobsProvider.tsx`, `JobsContext.ts`,
`useJobs.ts`, `jobsStore.utils.ts`, and their three test files.
`JobsProvider` is unmounted from `main.tsx` and from
`test/renderWithProviders.ts`, and the two dead exports leave
`features/jobs/index.ts`.

`jobsStore.types.ts` is deleted too, but `IUpdateJobTaskInput` moves
into `features/jobDetail/jobDetail.types.ts` first. Both of its
importers are already in that folder, so the type ends up next to the
panel that uses it.

**Rejected: leaving the provider mounted.** It would keep seeding and
rewriting `smart-job-tracker-jobs` in every visitor's browser for a
store no screen reads, and it would ship roughly 900 lines of
unreachable code in the bundle. `docs/context.md` section 3 already
records the provider as existing "until task 025", and the task 029
plan scoped its removal out only because "it still serves the
dashboard". This task is what makes that false.

**Rejected: unmounting it but keeping the files.** The files would keep
their tests, so the suite would stay green and the coverage report
would still count them, and the next reader would find a fully tested
provider and reasonably assume something used it. Dead code that looks
maintained is worse than dead code.

**Rejected: a follow-up task or a bug file.** `tasks/bugs/README.md`
asks for a bug when something is worth fixing but out of scope. Nothing
else on the roadmap makes this provider dead; this task does, and no
roadmap task owns the removal. Leaving it would mean shipping a state
no task is responsible for ending.

**Kept: `src/data/mockJobDetails.ts`.** Ten job detail test files import
it as a fixture. Only its use as a production seed disappears. Whether
those tests should build their own fixtures is a different question
with a different justification, and phase 4's acceptance criterion asks
that the mock data file no longer be "required for normal app usage",
which unmounting the provider satisfies.

### Decision 5: four new keys, and the retry label is reused

New in `en` and `de`: `dashboard.loading`, `dashboard.loadErrorTitle`,
`dashboard.noActivityYet`, `dashboard.noActivityYetDescription`.

The retry button reuses `jobs.loadErrorRetry` ("Try again"), following
task 029. The error *message* keeps coming from the `AppError` that
`getJobs` rejects with, so the title and the description stay two
different strings rather than two copies of one.

Verified rather than assumed: `translate` in `i18n/utils/translation.ts`
falls back to the key itself when a lookup misses, through
`getNestedMessage(...) ?? key`. A missed key therefore surfaces in a
test assertion as the literal string `dashboard.loading`, not as a
silent pass.

### Decision 6: the CORS allowlist is fixed here, not filed

The stack check found that **every browser write fails with 403** in
the Compose and Kubernetes runtimes.
`backend/src/main/kotlin/com/smartjobtracker/config/WebConfig.kt:12`
allowlists one origin, `http://localhost:5173`, which is the Vite dev
server. The containerised app is served from `localhost:30080`, so
Spring refuses every request the browser tags with that origin.

Reads survive by accident. Browsers omit `Origin` on same-origin GET,
so the list, dashboard and detail fetches never reach the check, while
POST, PUT and DELETE always carry it and are always refused. Confirmed
directly: the same `GET /api/jobs` answers 200 with no `Origin` header,
403 with `Origin: http://localhost:30080`, and 200 again with
`Origin: http://localhost:5173`.

It is pre-existing and older than this task, but it means the create,
edit and delete work from tasks 026 to 028 does not function in either
containerised runtime. It survived those tasks because
`npm run dev:local` serves from the one allowed origin, and because a
`curl` check sends no `Origin` at all - the two ways they were checked.

**The fix is to delete the CORS mapping, not to widen it.** The browser
never makes a cross-origin request in this architecture: Nginx serves
the app and proxies `/api` on one origin in Compose and Kubernetes, and
`vite.config.ts` already proxies `/api` to `localhost:4000` in dev. The
backend sees an `Origin` header at all only because those proxies
forward it.

Verified in `spring-webmvc-7.0.6` sources rather than assumed.
`AbstractHandlerMapping.getHandler` line 577 enters CORS processing only
`if (hasCorsConfigurationSource(handler) || CorsUtils.isPreFlightRequest(request))`,
and `hasCorsConfigurationSource` (line 712) is true when the handler is
a `CorsConfigurationSource` or the mapping's own
`corsConfigurationSource` is set. `addCorsMappings` is what sets it.
Remove the mapping and an ordinary request skips the branch entirely,
so the `Origin` header is ignored rather than judged.

One correction worth recording, because the first reading of this was
wrong. Preflight requests still enter the branch through the
`isPreFlightRequest` half, but they are not rejected:
`DefaultCorsProcessor.processRequest` line 75 returns `true` immediately
when the config is null. The preflight therefore answers 200 carrying no
`Access-Control-Allow-Origin`, and the *browser* blocks the real request
for want of that header. So after this change the server stops refusing
anything on the basis of `Origin`; genuine cross-origin browser calls
are still blocked, client-side, which is the normal posture for an API
served behind its own front end.

**Rejected: widening the allowlist to include `http://localhost:30080`
and `http://127.0.0.1:30080`.** It is the smallest diff and it treats
the symptom. It hardcodes runtime ports into application config, needs
both spellings of loopback, and drifts the next time a port, hostname
or deployment target changes.

**Rejected: making the origins configurable per runtime.** The right
answer once the frontend and backend are deployed to different hosts in
tasks 075 and 076, and premature until then. It also puts the value in
whichever manifest is easiest to forget, which is how this defect would
come back.

**Rejected: filing it as a bug.** It was filed as bug 005 first. On
instruction it is fixed here instead: leaving it would ship a task 025
that verifies the dashboard against a stack in which no write works.

The finding outlived this plan, so it has a permanent home in
`docs/engineering/same-origin-api-boundary.md`: the invariant, the
two-enforcer explanation, the table of checks that could not see the
defect, and what to verify before adding CORS configuration back.
`backend/AGENTS.md` section 3 carries the rule, and `docs/context.md`
section 3 records the absence as deliberate.

### Decision 7: the header stops claiming local tracker data

Every page carried a badge reading "Local tracker data", from
`AppShellHeader.tsx` via `app.localMockData` in both locales. Decision 4
is what makes it false.

The badge and both strings are removed rather than reworded. The header
already carries the app name, the stage label and the language select,
and a data-source note adds nothing once the source is the only one
there is. Rewording it to "Backend data" would keep a claim that needs
maintaining again at the next architecture move, which is how this one
went stale.

Two tests pinned the old text. `AppShellHeader.test.tsx` asserted the
badge directly and now asserts its absence. `AppShell.test.tsx` used the
German string as proof that switching language re-rendered the tree;
it now asserts the translated main-navigation label instead, which
tests the same thing without depending on copy this task removes.

**Rejected: filing it as a bug.** Filed as bug 006 first, then folded in
here on instruction. It is a three-line fix to copy this task falsified,
which `tasks/bugs/README.md` itself says should be fixed in the change
that found it.

## Proposed Change

### Edited

| File | Change |
| --- | --- |
| `routes/modules/dashboardRoute.tsx` | call `useJobsList`, pass four props |
| `pages/dashboard/DashboardPage.tsx` | three required props, three branches |
| `features/dashboard/components/DashboardRecentActivity.tsx` | empty branch |
| `features/jobDetail/jobDetail.types.ts` | owns `IUpdateJobTaskInput` |
| `features/jobDetail/components/JobDetailTasksPanel.tsx` | import moves |
| `features/jobs/index.ts` | drop `JobsProvider` and `useJobs` exports |
| `main.tsx` | stop mounting `JobsProvider` |
| `test/renderWithProviders.ts` | stop wrapping in `JobsProvider` |
| `i18n/locales/en.json`, `de.json` | four keys each |
| `routes/modules/dashboardRoute.test.tsx` | render under MSW |
| `pages/dashboard/DashboardPage.test.tsx` | props, plus three new cases |
| `components/appShell/layout/AppShellHeader.tsx` | data-source badge removed |
| `components/appShell/layout/AppShellHeader.test.tsx` | asserts the badge is gone |
| `components/appShell/AppShell.test.tsx` | language case no longer reads the badge |

### Deleted

| File | Why |
| --- | --- |
| `features/jobs/JobsProvider.tsx` and its test | no reader |
| `features/jobs/JobsContext.ts` | no provider |
| `features/jobs/useJobs.ts` and its test | no context |
| `features/jobs/jobsStore.utils.ts` and its test | no provider |
| `features/jobs/jobsStore.types.ts` | one type moved, two dead |
| `backend/.../config/WebConfig.kt` | the CORS mapping, per decision 6 |

`DashboardPage` prop shape:

```ts
interface IDashboardPageProps {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
}
```

`jobs` stays `TJob[]` and is `[]` until the request resolves, so
`getDashboardData` never sees `null` and its contract is unchanged.

## Tests

### `DashboardPage.test.tsx`

The two existing cases keep passing `createMockJobs()` through a local
render helper with prop overrides, as `JobsPage.test.tsx` does. That is
the evidence that the metric and meter calculations are preserved.

Three additions, all by props, no network:

- `isLoading` renders `role="status"` with the loading label, and no
  metrics.
- `error` renders `role="alert"` carrying the error's message, and the
  retry button invokes `onRetry`.
- an empty `jobs` array renders four zero metrics, six meters at
  `aria-valuenow` of 0, and the recent-activity empty copy.

The empty case is the one that earns its keep. It is the state a
first-run user lands on and the one no existing test could reach while
the provider seeded demo jobs.

### `dashboardRoute.test.tsx`

Rewritten against MSW, mirroring `jobsRoute.test.tsx`:

- renders metrics and recent activity once `GET /api/jobs` resolves,
  asserting a company name from the fixture so the assertion proves
  backend data rather than a rendered shell
- renders the error alert when the request fails

### Deleted tests, and what covered them

`JobsProvider.test.tsx`, `useJobs.test.tsx`, and
`jobsStore.utils.test.ts` go with their subjects. They are not being
dropped to make a suite pass; the code they cover is being removed.
`AGENTS.md` section 4 forbids weakening tests to go green, and deleting
a test alongside the production code it covers is the one case it is
not about.

## Implementation Order

Ordered so each failure names the next step.

1. **`IUpdateJobTaskInput` moves to `jobDetail.types.ts`.** Expected
   failure: `tsc` names `JobDetailTasksPanel.tsx` and
   `jobDetail.types.ts` if either import is missed.
2. **Translations, both locales.** Nothing to run; a missed key shows
   up as a raw key string in step 4's assertions.
3. **`DashboardRecentActivity` empty branch, and its test.** Run
   `DashboardRecentActivity.test.tsx`. Expected failure before the
   branch: the empty case finds no copy.
4. **`DashboardPage` props and branches, and its tests.** Expected
   failure: `tsc` names both call sites, because the props are
   required.
5. **`dashboardRoute` calls `useJobsList`.** Expected failure: the
   existing route test renders without an MSW handler, and
   `setupTests.ts` sets `onUnhandledRequest` to `error`, so it fails
   loudly rather than rendering an empty dashboard. That is the prompt
   to rewrite it.
6. **Retire the store.** Delete the five files and their tests, unmount
   from `main.tsx` and `renderWithProviders`, and drop the two barrel
   exports. Expected failure if anything was missed: `tsc` names the
   importer, and any test rendering a `useJobs` caller throws
   "useJobs must be used inside JobsProvider".
7. **Docs.** Last, once the behaviour is verified.

## Verification Plan

Focused first, per `AGENTS.md` section 3:

```bash
npm run frontend:test:coverage
```

```bash
npm run frontend:verify
```

```bash
npm run backend:verify
```

`npm run verify` is required after all, because decision 6 puts a file
under `backend/` in the diff. The change alters no route and no payload,
so the Postman collection needs no edit, but the backend gate has to
run: `AGENTS.md` section 3 asks for the app-level check for every app
that changed, and backend coverage is enforced at 100 per cent line and
branch.

Coverage is reported rather than gated on the frontend: `vite.config.ts`
configures the v8 provider and a reporter but sets no thresholds. So a
drop is something to read in the output and explain, not something the
build will catch. Removing `jobsStore.utils.ts`, which is large and
fully covered, will move the percentages; the number to watch is
whether anything *newly* uncovered appears, not the totals.

Every test here stubs the network at MSW, so none of them proves the
real endpoint answers in this shape. One manual check against
`npm run dev:compose` before this is called done, covering the three
things MSW cannot:

- the dashboard renders counts matching the jobs actually in the
  database
- a browser with a populated `smart-job-tracker-jobs` key still renders
  correctly, since the app no longer reads it
- the empty-database case renders the new activity copy rather than a
  blank card

## Scope Boundaries

In scope:

- The dashboard route reading `GET /api/jobs`.
- Loading, error, and empty rendering on that one page.
- Retiring the localStorage job store that the dashboard was the last
  screen to read.
- The CORS mapping that refuses every browser write in the
  containerised runtimes, per decision 6. Backend, and outside the
  original task file, but the stack check this task committed to is
  what found it and no other work would.
- The header badge this task falsified, per decision 7.

Out of scope:

- Any new endpoint or contract change. The one backend change is the
  removal of a CORS mapping, which alters no route and no payload.
- Dashboard analytics endpoints. The dashboard keeps deriving its
  numbers on the client from the full job list.
- Changes to `getDashboardData`, `dashboard.constants.ts`, or the
  metric and meter components beyond the activity empty state.
- The tasks, notes, and timeline tabs. Tasks 030 to 032.
- `src/data/mockJobDetails.ts`, which is now a test fixture.
- A `useAsyncQuery` extraction. Decision 1 records why it is now
  justified and still not this task.
- Optimistic updates. Task 035.
- A new library, and a data-fetching library, per `frontend/AGENTS.md`
  section 5.

## Completion Rules

After `npm run frontend:verify` and `npm run backend:verify` pass:

- Tick the acceptance criteria in
  `tasks/roadmap/025-replace-mock-jobs-on-dashboard-page.md` and set
  its status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Update `docs/context.md` section 3, which lists the dashboard among
  the screens reading localStorage and names `JobsProvider` as the
  reason the store still exists.
- Link this plan from `docs/business/README.md`.
- Record the CORS finding in `docs/engineering/`, with the rule in
  `backend/AGENTS.md` and the state in `docs/context.md`, so it is
  discoverable outside this plan.
- Send an `Origin` header from one write in the API collection, so
  `npm run api:test` can see this class of defect at all.
- Mark this plan `Completed` and add a verified-state section.
- No commit or push without being asked.

## Acceptance Criteria

- [x] Dashboard uses backend job data.
- [x] Existing calculations are preserved.
- [x] Tests cover user-visible states.

## Verified State

### What was built

Three props, three branches, one empty state, and a store removed.

| File | Change |
| --- | --- |
| `routes/modules/dashboardRoute.tsx` | calls `useJobsList` instead of `useJobs` |
| `pages/dashboard/DashboardPage.tsx` | `error`, `isLoading`, `onRetry`, three branches |
| `pages/dashboard/DashboardPage.test.tsx` | props helper, 4 new cases |
| `features/dashboard/components/DashboardRecentActivity.tsx` | `EmptyState` branch |
| `features/dashboard/components/DashboardRecentActivity.test.tsx` | 1 new case |
| `routes/modules/dashboardRoute.test.tsx` | rewritten against MSW, 2 cases |
| `features/jobDetail/jobDetail.types.ts` | owns `IUpdateJobTaskInput` |
| `features/jobDetail/components/JobDetailTasksPanel.tsx` | import moved |
| `features/jobs/index.ts` | two exports dropped |
| `main.tsx`, `test/renderWithProviders.ts` | provider unmounted |
| `i18n/locales/*.json` | four keys added, one removed, per locale |
| `components/appShell/layout/AppShellHeader.tsx` | data-source badge removed |
| `backend/.../config/WebConfig.kt` | deleted, per decision 6 |
| `backend/.../config/CorsPolicyTest.kt` | new: 2 cases |

Deleted: `JobsProvider.tsx`, `JobsContext.ts`, `useJobs.ts`,
`jobsStore.utils.ts`, `jobsStore.types.ts`, and the three test files
covering them.

The activity empty state reuses the shared `EmptyState` component
rather than adding markup, per `frontend/AGENTS.md` section 3. The plan
had not named a component for it.

### Each step failed where the plan said it would

Branch coverage rose from the 98.11 recorded at task 024, and nothing
newly uncovered appeared: the only frontend files below 100 per cent are
`jobFormSchema.ts`, `JobDetailPage.tsx`, `EditJobForm.tsx`, and
`NewJobPage.tsx`, all of which were already there.The activity empty case
found no copy and printed the empty list from the DOM; the route test
rendered "Loading dashboard" forever once the route fetched, because
`setupTests.ts` refuses an unhandled request.

### Checked against a running stack, not only MSW

Run against `npm run dev:compose`, with two jobs in the database.

| Question | Answer |
| --- | --- |
| do the metrics match the database | yes: 2 total, 2 active, 1 interview, 0 offers, against an API returning exactly that |
| do the status meters match | yes: Applied 1, Interview 1, everything else 0 |
| does recent activity render backend rows | yes, Personio and Celonis, both "Updated Sep 11" |
| is a populated `smart-job-tracker-jobs` key ignored | yes |
| does the app still write that key | no |
| does an empty database render the new copy | yes |

The localStorage case is the one worth recording. A job was planted
under the old key with company "STALE LOCAL JOB", status `OFFER`, and
an update date in 2030, so it would have sorted first in recent
activity and moved the Offers metric. After a full page load the
dashboard was unchanged and the key was byte-identical at 211
characters, which shows the app neither reads nor writes it any more.
Before this task the provider's effect would have rewritten it on
mount.

The empty case was reached by deleting both jobs through the API,
reading the dashboard, and recreating them afterwards.

### Two defects found, and fixed here rather than filed

Both were written up as bug 005 and bug 006 first. On instruction they
were folded into this task instead, and the two files removed.

**The CORS refusal, decision 6.** Found while trying to recreate the
deleted jobs through the Add Job form, which answered "Job could not be
created" against a stack whose API was plainly healthy.

`CorsPolicyTest` was written first and seen to fail against the unfixed
config, exactly as `tasks/bugs/README.md` requires:

| Case | Before the fix | After |
| --- | --- | --- |
| `GET /jobs` with the deployed origin | `expected:<200> but was:<403>` | passes |
| `POST /jobs` with the deployed origin | `expected:<201> but was:<403>` | passes |

Both failures carried the body `Invalid CORS request`. The read case
failing alongside the write is the useful part: it shows the refusal was
never about the verb, only about the header, which a same-origin GET
does not carry and a same-origin POST always does.

`WebConfig.kt` was then deleted. Nothing referenced it, and it held
nothing but the one `addCorsMappings` override.

**The header badge, decision 7.** `AppShellHeader` and both locale
strings, with the test that pinned the copy inverted to pin its absence.

**The collection now sends the header that would have caught it.**
`Create job` carries `Origin: {{appOrigin}}`, a new environment variable
holding the origin a browser loads the app from in that runtime, and
asserts the response is not a 403. It is the only request in the
collection with the header, deliberately.

That guard was watched failing too. With the old `WebConfig` restored
and the stack rebuilt, `npm run api:test` reported
`POST /api/jobs [403 Forbidden]` with `is not refused as an invalid CORS
request` failing and Newman exiting 1; removing the file and rebuilding
returned it to 26 assertions and 0 failures. CI runs this collection in
the Docker Build workflow, so the outer guard is live there.

### What the verification reported

| Check | Result |
| --- | --- |
| `npm run frontend:verify` | exit 0 |
| frontend tests | 305 passing across 112 files |
| frontend coverage | 99.59 statements, 98.91 branches, 100 functions, 100 lines |
| `npm run backend:verify` | exit 0, including the 100 per cent line and branch gate |

Deleting `WebConfig` did not strand coverage: `jacocoTestCoverageVerification`
passes, and the class was only ever covered incidentally, by executing
at context startup.

### Writes proven against the browser, which is the only place they failed

The CORS defect is invisible to every check that sends no `Origin`
header, so the fix had to be shown in a real browser against a rebuilt
stack rather than in a test. Each of the three writes that tasks 026 to
028 shipped was exercised through the UI:

| Action | Request | Result |
| --- | --- | --- |
| Add job form | `POST /api/jobs` | 201 |
| Edit job form | `PUT /api/jobs/{id}` | 200 |
| Delete from job detail | `DELETE /api/jobs/{id}` | 204 |

The created job appeared in the list as row 3 of 3, the edit renamed it,
and the delete returned the database to the two jobs it started with,
with the dashboard reading 2 total, 2 active, 1 interview afterwards.

### The transitional inconsistency is over

Task 024 recorded that the list read the backend while the forms and
the dashboard did not, and predicted it would close across 025 to 028.
It has. Every screen now reads one source, and there is no second store
to diverge from it.

## Review Fixes

A review of pull request #30 raised four findings. All four were applied
on the branch. Every one of them was about a **guard that could not fail
for the reason it existed**, which is the same shape as the checks that
missed the CORS defect in the first place.

### Applied

| Area | Change |
| --- | --- |
| `CorsPolicyTest` | both cases assert the response carries no `Access-Control-Allow-Origin` header |
| API collection | `Update job` and `Delete job` send `Origin` and carry the same assertion |
| API collection | the create assertion widened and renamed to `the backend applied no CORS processing` |
| `main.tsx` | clears the retired `smart-job-tracker-jobs` key at startup |
| `utils/clearLegacyJobStorage.ts` | new, with two cases |
| docs | three places claimed the header sat on one request only |

### Why the header assertion, and not a second origin

Findings 1 and 2 looked separate and share one fix.

The first: asserting only "not 403" stays green for
`allowedOrigins("*")`, which answers a future 403 by opening the API to
every site rather than removing the check. The second: the local
environment sends `http://localhost:5173`, which is exactly the origin
the deleted mapping allowed, so `npm run api:test:local` could not see a
reinstated mapping at all.

Asserting the **absence of an allow-origin header** closes both. A
mapping emits that header for any origin it permits, so the check stops
depending on which origin is sent, and a permissive mapping fails it as
surely as a restrictive one.

The local `appOrigin` value therefore stays at `http://localhost:5173`.
It is documented as "the origin a browser loads the app from in that
runtime", and that is true; changing it to make the guard bite would
have made the variable describe something false to compensate for a weak
assertion.

### All three write verbs, not just create

A CORS mapping restricts methods as well as origins. One allowing `GET`
and `POST` would have broken edit and delete in the browser while
`Create job` stayed green - the original defect's blind spot, narrowed
rather than removed.

### The widened guard was watched failing

Restoring `WebConfig` with `allowedOrigins("*")`, the exact scenario the
finding described:

```text
CorsPolicyTest > a read carrying the deployed app origin is served() FAILED
CorsPolicyTest > a write carrying the deployed app origin is served() FAILED
2 tests completed, 2 failed
```

The status assertions still passed; both cases failed on the header,
which is precisely the hole that existed before. Deleting the file
returned them to green.

`npm run api:test` then reported 28 assertions and 0 failures against a
rebuilt stack, with `Origin: http://localhost:30080` confirmed in
`newman.json` on `POST`, `PUT` and `DELETE`.

### The stale key

Nothing had read `smart-job-tracker-jobs` since the provider was
removed, so it would have sat in every existing browser indefinitely
holding job data no screen can reach - including entries a user made
through the add form before task 026 connected it to the backend.
`clearLegacyJobStorage` removes it at startup. Storage access is wrapped
in `try`/`catch`, because a private window or blocked site data throws
rather than returning null, and a browser that refuses storage has
nothing to clear.

| Check | Result |
| --- | --- |
| `npm run verify` | exit 0 |
| frontend tests | 307 passing, two added |
| `npm run api:test` | 28 assertions, 0 failures |
