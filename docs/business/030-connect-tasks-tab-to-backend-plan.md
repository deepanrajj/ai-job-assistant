# Task 030 - Connect Tasks Tab To Backend Plan

Status: Completed

## Purpose

Make the job detail tasks tab read and write real tasks through
`taskService` instead of rendering `job.tasks`, which has been an empty
array on every backend job since task 023's `mapJobToJobDetail`. Task
021 built the service; nothing has called it yet.

Task 029 left the tab wired for this: `JobDetailTasksPanel` already
takes `onCreateTask`/`onUpdateTask`/`onDeleteTask`, but `JobDetailPage`
stopped passing them when it stopped writing to localStorage, so today
the tab renders zero tasks and every control is disabled. This task
gives it real data and working controls.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/030-connect-tasks-tab-to-backend.md`
- `docs/business/021-add-task-service-plan.md` (the service this calls)
- `docs/business/029-connect-job-detail-page-to-backend-plan.md` (the
  pattern this follows for a backend-fed hook, and why the page stopped
  passing task actions)

## Current State

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API calls | `getTasks`, `createTask`, `updateTask`, `deleteTask` (`services/tasks`), job-scoped, both ids encoded |
| wire types | `TTaskResponse` (`dueDate: string \| null`), `TCreateTaskRequest`, `TUpdateTaskRequest` (full replacement, explicit `null` clears the date) |
| async state | `useAsyncMutation`, with request-id race guarding |
| a precedent for a list-loading hook | `useJobsList` |
| a precedent for a job-scoped write hook with a bundled-args mutation fn | `useUpdateJob` (`putJobFields`) |
| the tab's UI | `JobDetailTasksPanel`: add-task form, task rows with a toggle checkbox and delete button, all already gated on their handler prop |
| the dispatch that binds `job.id` into task callback signatures | `JobDetailActivePanel` |

### What is missing

- Nothing calls `getTasks`. `JobDetailTasksPanel` renders `job.tasks`,
  and every `TJobDetail` has `tasks: []` (`mapJobToJobDetail`).
- `JobDetailPage` does not pass `onCreateTask`/`onUpdateTask`/
  `onDeleteTask` to `JobDetailTabs`, so even where the panel offers a
  control it renders disabled.
- `TTaskResponse.dueDate` is nullable; `TJobTask.dueDate` is required
  `string`. No mapper exists between them.
- `TUpdateTaskRequest` requires `title`, `status`, and `dueDate`
  together. The panel's only update path today is the toggle checkbox,
  which only has a status to send (`IUpdateJobTaskInput` is partial).
  Nothing currently builds the full replacement body.
- `getJobTaskDueLabel` always calls `formatJobDate(task.dueDate, ...)`
  with no empty check. Every task in the current mock/local data has a
  due date, so this has never been exercised with an empty one. A
  backend task can have `dueDate: null`, which becomes newly reachable
  through this task.

### Verified before writing this plan

**`PUT /api/jobs/{jobId}/tasks/{taskId}` really is a full replacement.**
Read from `TaskController.updateTask` and `TaskCrudIntegrationTest`
(cited in the task 021 plan): `UpdateTaskRequest` requires `title` and
`status`, and `dueDate` is a required key whose `null` value clears the
column. There is no partial-update route. Confirmed by reading the
service test names task 021 already cited, not re-probed.

**Nothing else reads `job.tasks`.** Grepped `job.tasks` and
`\.tasks\b` across `frontend/src/features/jobDetail` and
`frontend/src/pages`: the only reader is `JobDetailTasksPanel` (and its
own tests). Nothing else breaks when the panel stops taking a `job`
prop.

**`onCreateTask`/`onUpdateTask`/`onDeleteTask` have exactly one
consumer chain and it currently receives nothing.** Grepped for the
three names across `frontend/src`: `jobDetail.types.ts` declares them
on `IJobDetailPageActions`, `JobDetailTabs` and `JobDetailActivePanel`
thread them through, and `JobDetailTasksPanel` is the only place they
are called. `JobDetailPage` (the one caller of `JobDetailTabs`) passes
none of them. Removing the three members and the two threading points
deletes no live behaviour, because none exists yet.

## Decisions

### Decision 1: the tasks panel fetches for itself; `job` is replaced by `jobId`

`JobDetailTasksPanel` takes `jobId: string` instead of `job: TJobDetail`
and owns a new hook, `useJobTasks(jobId)`, that loads, creates, updates,
and deletes.

**Rejected: a `useJobTasks` call in `JobDetailPage`, threaded down
through `JobDetailTabs` and `JobDetailActivePanel` as more props**,
mirroring how `jobDetailRoute` owns `useJobDetail` for decision 3 of
task 029. That decision was for the page's own resource, fetched once
and needed by every tab. Tasks belong to one tab out of five: fetching
them at the page level means every job detail visit issues a tasks
request even when the user never opens that tab, and it means
`JobDetailTabs`/`JobDetailActivePanel` grow five more props (three
callbacks plus loading/error) for data only one of the five panels they
dispatch to uses. `JobDetailActivePanel` already unmounts the panel for
whichever tab is not active, so a panel-owned hook fetches exactly when
the tab is opened and stops holding state when it is not, for free.

**Rejected: keep `job.tasks` and populate it from the page.** `TJob`
has no tasks field and the backend has no endpoint that returns a job
with its tasks embedded; the only way to reach `job.tasks` is a second,
separate request per job, which is what this decision already does
without inventing a wider `TJobDetail` shape for it.

### Decision 2: `useJobTasks` reloads the list after every write, no local patching

```ts
interface IJobTasksState {
  createJobTask: (title: string, dueDate: string) => Promise<void>;
  deleteJobTask: (taskId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  reload: () => void;
  tasks: TJobTask[];
  updateJobTask: (taskId: string, input: IUpdateJobTaskInput) => Promise<void>;
}
```

Each of `createJobTask`/`updateJobTask`/`deleteJobTask` calls its
service function and, on success, calls the same `reload()` the mount
effect uses, so the rendered list is always what `GET` just returned
rather than a hand-patched copy of it.

**Rejected: patch the local array in place** (append the created task,
replace the updated one, filter out the deleted one). This is what task
035, "Add optimistic updates where useful," is for. Scope boundaries in
`AGENTS.md` section 2 make the task file the execution boundary, and
task 030's own file lists optimistic updates as a later, separate
concern (035), not this one. Patching now would also mean carrying the
server's actual field values (a create response's real id, a status
default) through by hand instead of by asking for them again, which is
exactly the class of bug an unvalidated local patch invites.

**Consequence accepted:** a create, toggle, or delete visibly reloads
the whole list, so the panel's loading state reappears briefly after
every write. This is the cost of decision 2, not a defect; task 035 is
where it is designed away.

### Decision 3: mutation functions are module-level with bundled args, like `useUpdateJob`

```ts
const postTaskFields = ({ jobId, payload }: ICreateJobTaskInput) => createTask(jobId, payload);
const putTaskFields = ({ jobId, taskId, payload }: IUpdateJobTaskFieldsInput) =>
  updateTask(jobId, taskId, payload);
const removeTaskFields = ({ jobId, taskId }: IDeleteJobTaskInput) => deleteTask(jobId, taskId);
```

Same reasoning `useUpdateJob` gives: `useAsyncMutation` keys `mutate`'s
identity on the mutation function, so a mutation function built inside
the hook body (closing over `jobId`) would get a new identity every
render, and anything depending on that identity (the mount effect, via
`reload`) would refire every render. Declaring the functions at module
scope and passing `jobId` as part of the single argument keeps their
identity stable across renders, matching `getTasks` itself, which is
already stable because it is imported directly and takes `jobId` as its
only argument.

### Decision 4: `updateJobTask` builds the full replacement body from the loaded list

`IUpdateJobTaskInput` stays partial (`{ status?, title?, dueDate? }`),
matching what the checkbox toggle actually has to send. `useJobTasks`
looks the task up in its own `tasks` state and fills in whatever the
caller did not send:

```ts
export const buildJobTaskUpdateRequest = (
  task: TJobTask,
  input: IUpdateJobTaskInput,
): TUpdateTaskRequest => ({
  title: input.title ?? task.title,
  status: input.status ?? task.status,
  dueDate: (input.dueDate ?? task.dueDate) || null,
});
```

Lives in `jobDetail.utils.ts` next to `isJobTaskComplete` and
`getJobTaskDueLabel`, the other task-shaped helpers already there, and
is exported so its own test can cover the merge without a network
round trip. It takes `TUpdateTaskRequest` (a service type) as its return
type; `JobDetailAiPanel` already imports a service function
(`analyzeJobDescription`) directly into this feature folder, so a
feature file depending on a service type is an existing pattern here,
not a new one.

If the caller's `taskId` is not in the currently loaded list (a stale
row, a request that lands after a delete), `updateJobTask` resolves
without calling the API. There is nothing correct to send.

**Rejected: require every caller to pass a full `TUpdateTaskRequest`.**
The panel's toggle handler only knows the one field it is changing;
making it read `title` and `dueDate` off the task itself just to hand
them back unchanged would move this same merge into the panel, further
from the type it is merging against.

### Decision 5: a null due date is a real, renderable state, not defaulted away

`services/tasks/tasks.utils.ts` gains:

```ts
export const mapTaskResponseToJobTask = (response: TTaskResponse): TJobTask => ({
  id: response.id,
  title: response.title,
  status: response.status,
  dueDate: response.dueDate ?? '',
});
```

Mirrors `mapJobResponseToJob`'s placement in the service layer (the
wire-to-domain mapper lives beside the service it maps for), not
`mapJobToJobDetail`'s placement in `features/jobs` (that one widens a
domain type into a richer domain type; this one narrows a wire type
into the existing domain type).

`getJobTaskDueLabel` (`jobDetail.utils.ts`) gains the branch it was
missing:

```ts
export const getJobTaskDueLabel = (task, language, t) =>
  task.dueDate
    ? t('jobDetail.tasks.due', { date: formatJobDate(task.dueDate, language) })
    : t('jobDetail.tasks.noDueDate');
```

**Rejected: leave it and let a null date reach `formatJobDate`.**
`new Date('')` is an Invalid Date; `Intl.DateTimeFormat.format` on it
renders the literal string "Invalid Date" in the UI. The add-task form
still requires a due date before enabling submit (unchanged from
today), so nothing created through this tab produces a null date, but a
task created by another API client is real, reachable data the moment
this tab reads from the backend, and the UI it renders into has to be a
real string.

### Decision 6: mutation failures render inline; the list state stays

`loadError` (from the initial `GET`) blocks the tab: nothing is known
to render, so the panel shows `ErrorState` with a retry, same shape as
`JobDetailPage`'s own load-error branch.

`mutationError` (create/update/delete) renders as an `Alert` above the
existing content, the same convention `JobDetailAiPanel` already uses
for its own `useAsyncMutation` error, without hiding the task list that
is still correctly loaded. Combined from whichever of the three
mutation hooks last failed (`createError ?? updateError ?? deleteError`)
rather than three separate banners, since only one write is ever in
flight at a time from this UI and a fallback message already exists per
operation (`tasks.fallbackError.*`, task 021).

`isMutating` (any of create/update/delete in flight) disables the
add-task inputs, the submit button, every toggle checkbox, and every
delete button, so a second click cannot fire a second write while one
is in flight — the same shape `JobDetailAiPanel` uses
(`disabled={request.isLoading || ...}`).

### Decision 7: dead task-action plumbing is removed, not left disabled

`onCreateTask`, `onUpdateTask`, `onDeleteTask`, and `IUpdateJobTaskInput`
are removed from `IJobDetailPageActions`; `JobDetailTabs` and
`JobDetailActivePanel` stop destructuring and threading them.
`IUpdateJobTaskInput` moves to being exported directly from
`jobDetail.types.ts` for `useJobTasks` to import (it already lives
there; only its consumer changes).

This is not a drive-by refactor: per the verified state above, these
three props have never had a live caller since task 029, and this task
is the one that decides how the tab actually gets its data, which
turns out not to be "the page hands the panel a callback." Leaving
three props on a shared interface that nothing will ever populate again
is the misleading state, not removing them. `onAnalyzeJob`,
`onCreateNote`, `onDeleteNote`, `onUpdateNote`, `onDeleteJob`, and
`onStatusChange` are untouched; they belong to tabs and controls this
task does not change.

### Decision 8: a shared default MSW handler for the tasks list

`test/handlers.ts` gains:

```ts
http.get('/api/jobs/:jobId/tasks', () => HttpResponse.json([])),
```

Several existing tests render `JobDetailTabs`, `JobDetailActivePanel`,
or `JobDetailPage` and click through to the tasks tab as part of
asserting tab-switching or page-level behaviour that has nothing to do
with task content (`JobDetailTabs.test.tsx`,
`JobDetailActivePanel.test.tsx`, `JobDetailPage.test.tsx`). Once the
tasks tab performs a real fetch, all three trigger a real, unhandled
request under `setupTests.ts`'s `onUnhandledRequest: 'error'` the
moment they open that tab, for tests that assert nothing about tasks.

This mirrors why `handlers.ts` already carries default handlers for
`/api/ai/analyze-job` and `/api/ai/ask-job`: incidental renders need an
answer, and an empty list is the correct default because it changes
nothing about what those tests assert. The existing comment in
`handlers.ts` explaining why `GET /api/jobs` has no default still
applies to that endpoint for the reason it gives; it does not extend to
this one, whose incidental callers do not care what it returns. A test
that does care about task content calls `server.use` with its own
handler, same as every task/job/note test already does.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobDetail/useJobTasks.ts` | the hook from decisions 1-4 |
| `frontend/src/features/jobDetail/useJobTasks.test.tsx` | its test, against MSW |
| `frontend/src/test/mockTasks.ts` | `createMockTaskResponse`, mirroring `test/mockJobs.ts` |

### Changed files

| File | Change |
| --- | --- |
| `services/tasks/tasks.utils.ts` | add `mapTaskResponseToJobTask` |
| `services/tasks/tasks.utils.test.ts` (new) | covers the mapper's null-to-empty-string conversion |
| `features/jobDetail/jobDetail.types.ts` | drop the three task-action members from `IJobDetailPageActions` |
| `features/jobDetail/jobDetail.utils.ts` | add `buildJobTaskUpdateRequest`; fix `getJobTaskDueLabel`'s empty-date branch |
| `features/jobDetail/jobDetail.utils.test.ts` | cover both additions |
| `features/jobDetail/components/JobDetailTasksPanel.tsx` | take `jobId`, call `useJobTasks`, render loading/error/mutation states |
| `features/jobDetail/components/JobDetailTasksPanel.test.tsx` | rewritten against MSW |
| `features/jobDetail/components/JobDetailActivePanel.tsx` | pass `jobId={job.id}` instead of task callbacks for the `tasks` branch |
| `features/jobDetail/components/JobDetailActivePanel.test.tsx` | drop the task-binding case; the panel needs no more than the shared default handler for its existing "renders the selected panel" coverage |
| `features/jobDetail/components/JobDetailTabs.tsx` | stop destructuring/threading the three task props |
| `test/handlers.ts` | the default handler from decision 8 |
| `i18n/locales/en.json`, `de.json` | add `jobDetail.tasks.loading`, `jobDetail.tasks.loadErrorTitle`, `jobDetail.tasks.noDueDate` |

`JobDetailTasksPanel` props become `{ jobId: string }`.

## Tests

### New: `useJobTasks.test.tsx`

Probe component pattern, following `useJobDetail.test.tsx`: MSW
handlers per test via `server.use`.

| Case | Asserts |
| --- | --- |
| loads and maps tasks | list renders; a null wire due date maps to `''` |
| a failed list load is `loadError` | `tasks` stays `[]`, retry works |
| create reloads the list | POST fires, then a second GET returns the new row, and it renders |
| a failed create sets `mutationError` and does not reload | list unchanged |
| update sends the full body, merged from the loaded task | toggling status alone still sends the task's own title and due date |
| a failed update sets `mutationError` | list unchanged |
| delete reloads the list | row is gone after the round trip |
| a failed delete sets `mutationError` | list unchanged |

### New: `tasks.utils.test.ts`

`mapTaskResponseToJobTask`: a populated response and one with
`dueDate: null`, asserting the empty string.

### Changed: `jobDetail.utils.test.ts`

- `getJobTaskDueLabel`: existing due-date case unchanged, plus a new
  case for an empty `dueDate` rendering `noDueDate`.
- `buildJobTaskUpdateRequest`: status-only input keeps title/due date;
  a full input passes through; an input with no due date on a task with
  none sends `null`.

### Rewritten: `JobDetailTasksPanel.test.tsx`

Drops `job`/`mockJobDetails`; renders `<JobDetailTasksPanel jobId="..." />`
against `server.use` handlers per case, following the `useJobDetail`/
`JobDetailPage` MSW convention.

| Case | Asserts |
| --- | --- |
| renders loaded tasks, summary, and due dates | including the empty-due-date row |
| renders the loading state | `role="status"` while the request is in flight |
| renders the load error with a working retry | `role="alert"`, retry re-fetches |
| creates a task | form submit, POST body, list refetches and shows the new row |
| toggles a task complete and back | checkbox click, PUT body carries the full task |
| deletes a task | button click, DELETE fires, list refetches without the row |
| renders a mutation failure without losing the list | failed POST/PUT/DELETE shows the alert; existing rows stay visible |
| disables the form and controls while a write is in flight | matches the pre-existing "ignores empty submissions" case, extended |
| ignores empty task submissions | unchanged from today |

### Changed: `JobDetailActivePanel.test.tsx`

Drops `onCreateTask`/`onUpdateTask`/`onDeleteTask` from
`createActionProps` and the "binds the current job id to task actions"
case entirely; the jobId-binding behaviour for tasks is now covered by
`JobDetailTasksPanel.test.tsx` asserting the request URL it makes. The
remaining "renders the selected read-only panel" case is unaffected
(it exercises `overview` and `timeline`, not `tasks`), and relies on
`test/handlers.ts`'s new default if a future case exercises `tasks`
here too.

### Changed: `JobDetailTabs.test.tsx`

No prop changes needed at this layer (it never referenced the task
callbacks directly), but its existing click-through to the Tasks tab
now performs a real fetch; covered by the `test/handlers.ts` default
from decision 8, so no per-test handler is added here.

### Unchanged and used as proof: `JobDetailPage.test.tsx`

Already clicks into the Tasks tab twice as part of asserting page-level
tab behaviour, unrelated to task content. Must keep passing on the
shared default handler alone, with no `server.use` addition, as proof
decision 8 covers it.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add `mapTaskResponseToJobTask` and its test. Nothing consumes it
   yet; the rest of the suite stays green.
3. Fix `getJobTaskDueLabel` and add `buildJobTaskUpdateRequest` with
   tests. Run `jobDetail.utils.test.ts` alone first.
4. Add the default MSW handler in `test/handlers.ts`. Run
   `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`, and
   `JobDetailPage.test.tsx` before anything else changes — they must
   stay green, proving the handler alone is enough for their existing
   Tasks-tab clicks.
5. Add `useJobTasks` and its test. Expect the update case to be the
   fiddly one: it has to assert the PUT body carries fields the caller
   never passed, which is decision 4 arriving in the test before the
   panel.
6. Rewrite `JobDetailTasksPanel` for `jobId`. Run its existing test
   **before** touching it: every case must fail to compile or fail to
   find `job`, proving the panel no longer reads a prop-supplied task
   list. Then rewrite its cases.
7. Update `JobDetailActivePanel`'s `tasks` branch and its test.
8. Remove the three members from `IJobDetailPageActions` and stop
   threading them in `JobDetailTabs`. Expect a compile error at any
   remaining reference; there should be none left after step 7.
9. Add `mockTasks.ts` used by steps 5-7's tests, ahead of them per file
   dependency (adjust ordering in practice as the tests are written).
10. Add the three translation keys, both locales.
11. `npm run frontend:verify`.
12. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/useJobTasks.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/components/JobDetailTasksPanel.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend file changes and no
contract change; the four task endpoints already exist and are already
covered by the Postman collection's `Jobs` folder allowlist from
earlier tasks. `AGENTS.md` section 3 asks for the app-level check for
the app that changed, and the task file's own validation line is
`npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No notes or timeline tab integration. Tasks 031 and 032.
- No optimistic local patching of the task list. Task 035, per
  decision 2.
- No loading/error state work for other tabs or screens. Tasks 033/034
  cover the rest of the app; this task's loading/error states are
  scoped to what task 030's own file asks for on the tasks tab.
- No change to the add-task form's due-date requirement. A task
  created elsewhere can arrive with no due date (decision 5); creating
  one through this tab still requires picking one, unchanged from
  today.
- No new library, and no data-fetching library, per `frontend/AGENTS.md`
  section 5.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/030-connect-tasks-tab-to-backend.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated: it does not enumerate which tabs
  are backend-fed at this level of detail (checked; only task 029's
  edit of it concerned the page-level read path).

## Acceptance Criteria

- [x] Tasks tab uses backend APIs.
- [x] Existing UI behavior is preserved.
- [x] Tests cover task user flows.

## Verified State

Built as planned, with three small additions the plan did not list:

- `services/tasks/tasks.utils.test.ts` (new) covers
  `mapTaskResponseToJobTask` directly, beyond what `useJobTasks.test.tsx`
  exercises through it.
- `frontend/src/pages/jobDetail/JobDetailPage.test.tsx`'s "offers no
  write it cannot complete" case dropped its Tasks-tab assertion. That
  case predates this task and asserted the tab offered no working
  control; task 030 is exactly what makes that no longer true, so the
  assertion was deleted rather than weakened, per `AGENTS.md` section 4
  ("existing tests may change only when expected behavior intentionally
  changed").
- Three extra test cases closed branch-coverage gaps the first pass
  left open: `buildJobTaskUpdateRequest` with only `title` set (the
  `status` fallback branch), `useJobTasks.updateJobTask` called with an
  id not in the loaded list (the not-found guard), and toggling a task
  back from complete to incomplete in `JobDetailTasksPanel.test.tsx`
  (the reverse arm of the toggle ternary).

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 117
test files and 346 tests, 100 percent of lines (947/947) and functions
(374/374), production build fine. Branch coverage is 98.95 percent; the
four files below it (`jobFormSchema.ts`, `JobDetailPage.tsx`,
`EditJobForm.tsx`, `NewJobPage.tsx`) were already there before this
change, confirmed from the per-file report, with nothing added here
left uncovered.

### What was built

`useJobTasks(jobId)` loads a job's tasks and offers create, update, and
delete, each reloading the list from the server on success rather than
patching it locally. `JobDetailTasksPanel` owns this hook directly and
takes `jobId` instead of a `job` prop, rendering its own loading,
load-error, and mutation-error states. `mapTaskResponseToJobTask` and
`buildJobTaskUpdateRequest` handle the two real mismatches between the
wire and UI shapes: a nullable due date, and a write endpoint that
requires the full task even when only one field changed.
`onCreateTask`/`onUpdateTask`/`onDeleteTask`, which had had no live
caller since task 029, were removed from `IJobDetailPageActions` and
the two components that threaded them.

### Failures observed deliberately

Two, each run before the code that fixes it.

- Every existing `JobDetailTasksPanel` case failed once the panel
  stopped reading a `job` prop (missing `job`/type errors), proving it
  no longer renders from prop-supplied data.
- `JobDetailTabs.test.tsx`, `JobDetailActivePanel.test.tsx`, and
  `JobDetailPage.test.tsx` were run against the new default MSW handler
  alone, before the panel's own rewrite, and stayed green - confirming
  decision 8 covers their incidental Tasks-tab clicks without a
  per-test handler.

### Changed from the plan

None beyond the three additions above; the design followed the plan's
decisions as written.
