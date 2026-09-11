# Task 026 - Connect Add Job Form To Backend Plan

Status: Completed

## Purpose

Make `/jobs/new` create jobs through `POST /api/jobs` instead of writing
to the localStorage provider. Task 024 moved the jobs list onto the API;
this is the first *write* to reach the backend from the UI, and it closes
the half of the task 024 divergence where a job created in the app never
appeared in the list.

The interesting work is not the call. `createJob` and
`mapJobToCreateRequest` already exist. It is that submitting becomes
asynchronous and fallible for the first time, which the task file does
not mention and which decides three things: who owns the request state,
what happens to a rejection React Hook Form does not swallow, and what a
second click on a slow submit does.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/026-connect-add-job-form-to-backend.md`
- `docs/business/020-add-job-service-plan.md`
- `docs/business/023-add-typed-api-response-models-plan.md`
- `docs/business/024-replace-mock-jobs-on-jobs-list-page-plan.md`

## Current State

### How a job is created today

```text
jobNewRoute.tsx   const { createJob } = useJobs()  -> <NewJobPage onSave={createJob} />
NewJobPage        useForm + zodResolver; on submit calls onSave then navigates
JobsProvider      createJob writes the job into localStorage
```

`NewJobPage` owns the form: the schema built from localized messages, the
default values, cancel, and submit. Submit is synchronous today, so it
cannot fail and there is nothing to wait for:

```ts
onSave?.(createJobFormPayload(values));
navigate(APP_PATHS.JOBS);
```

`jobNewRoute` is the only caller of the provider's `createJob` in
application code. Nothing else references it.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API call | `createJob` from task 020, typed to `TCreateJobRequest` |
| form fields to request body | `mapJobToCreateRequest` from task 023 |
| response to UI model | `mapJobResponseToJob` from task 023 |
| async state | `useAsyncMutation`, with request-id race guarding |
| an error surface | `ErrorState`, `role="alert"`, optional action slot |
| a localized failure message | `jobs.fallbackError.createJob` |
| a precedent for a feature hook over that state | `useJobsList` from task 024 |

So this is wiring plus the consequences of going asynchronous.

### What the form payload helper does that a create must not

`createJobFormPayload(values)` returns a whole `TJob`, including
`id: createLocalId('job')` and both timestamps. Those three fields are
exactly the ones the server owns. Feeding its result to
`mapJobToCreateRequest` works, because the request mapper reads only the
editable fields, but it manufactures a local id on every submit of a
form whose id is about to come from the backend. Two id spaces in one
flow is what produced bug 004.

### Verified before writing this plan

Two claims in the decisions below were checked rather than remembered.

**React Hook Form rethrows a rejecting submit handler.** A throwaway
probe rendered `useForm` and called
`handleSubmit(() => Promise.reject(new Error('boom')))()`. The returned
promise rejected with that error, and the handler ran exactly once. So a
submit handler that lets the create call reject produces an unhandled
rejection at the DOM submit boundary, and the handler must catch. The
probe was deleted. React Hook Form is 7.72.1 here.

The probe also tried to read `formState.isSubmitting` and `submitCount`
afterwards and got an inconsistent answer, because `formState` is a proxy
that decides re-renders from which properties a render actually touched.
Reading it outside a render is not a reliable signal. That is a reason to
take the pending flag from `useAsyncMutation` instead, not a finding
about React Hook Form.

**The only app caller of the provider's `createJob` is the route.** A
grep across `frontend/src` returns `jobNewRoute.tsx:12` and the
provider's own test.

## Decisions

### Decision 1: a `useCreateJob` hook in `features/jobs`

A new hook wrapping `useAsyncMutation(createJob)`, mirroring
`useJobsList` from task 024. It exposes a `saveJob` that returns the
created `TJob`, plus `error` and `isSaving`.

Reasoning: task 024 established exactly this shape for a screen that
talks to the job service, one file with one test, and the next three
tasks each need their own. Following the precedent costs nothing and
makes 027 and 028 obvious.

**Rejected: call the service directly inside `NewJobPage`.** It is two
lines shorter and it puts request bookkeeping in a component that already
owns a form state machine. The page would hold its own `useState` for
error and pending, which is `useAsyncMutation` rewritten worse, without
the request-id guard that stops a slow first response from overwriting a
fast second one.

**Rejected: add the API call to `JobsProvider`.** The provider is
localStorage-backed and serves the dashboard and detail page, which are
tasks 025 and 029. Changing it here would reach outside this task, and
the task file puts edit integration out of scope.

### Decision 2: `NewJobPage` owns the hook; the route goes thin

`jobNewRoute` renders `<NewJobPage />` with no props. The `onSave` prop
is removed.

This differs from task 024, where `jobsRoute` owns `useJobsList` and
`JobsPage` stayed presentational, so it needs justifying rather than
assuming.

`JobsPage` was kept presentational because it owns no state of its own
and its existing search, filter and sort tests pass plain arrays; making
it fetch would have forced MSW into every one of them. `NewJobPage` is
the opposite: it already owns `useForm`, the resolver, the localized
schema and navigation. The create call is one step inside the submit
handler it already owns. Splitting that across the route boundary would
give the submit flow two owners, with the route holding the request and
the page holding the form that must not lose its values when the request
fails.

**Rejected: the route owns `useCreateJob` and passes `onCreate`, `error`
and `isSaving` down.** It matches 024 literally while making the design
worse, because the page would still be stateful and the error that must
not clear the form would live one component further away from the form.

### Decision 3: the submit handler must catch its own rejection

Verified above: `handleSubmit` rethrows. So:

```ts
try {
  await saveJob(payload);
  navigate(APP_PATHS.JOBS);
} catch {
  // Error is already recorded in request state and rendered from it.
}
```

Without the `catch`, a failed create still renders correctly, because
`useAsyncMutation` records the error before rethrowing, and *also*
produces an unhandled promise rejection. `useJobsList` documents the same
trap for the same reason, and `AnalyzeJobPage` catches for it too.

The navigate call sits inside the `try`, after the await, so a failed
create stays on the form. That is what "show API errors without losing
user input" reduces to: do not navigate, do not reset.

**Rejected: `.then(...).catch(...)` without `async`.** Equivalent, and
the `await` reads as the sequence it is.

### Decision 4: a form-fields payload helper, so no local id is minted

`jobForm.utils.ts` gains `createJobFormFields(values)`, returning the
editable fields as `TJobFormPayload`. `createJobFormPayload` is rebuilt
on top of it, adding `id`, `createdAt` and `updatedAt` exactly as before,
so the edit page keeps its current behaviour byte for byte.

`NewJobPage` then calls `mapJobToCreateRequest(createJobFormFields(v))`
and never mints a local id.

**Rejected: `mapJobToCreateRequest(createJobFormPayload(values))`.** It
compiles and sends the right body, because the mapper ignores the three
server-owned fields. It also calls `createLocalId` on every submit and
leaves a `job-...` id in a payload heading for an endpoint that assigns
its own. Anyone reading it has to work out that the id is discarded.

**Rejected: duplicating the optional-field normalization in a second
helper.** The blank-to-undefined and salary-to-number rules would then
exist twice, and the create and edit paths could drift on what an empty
string means.

### Decision 5: success navigates to the jobs list, not the new job

`navigate(APP_PATHS.JOBS)`, which is what the page does today.

The tempting alternative is the new job's detail page, which is the
normal thing to do after a create and which the response makes possible,
since it carries the server-assigned id.

**Rejected: navigate to the job detail page.** The detail page still
resolves its route id against localStorage, so a backend UUID lands on
"Job not found". That is the defect retired into task 029. Sending the
user there would recreate bug 004 on a second screen and turn a working
flow into a dead end. The list reads the API as of task 024, so the new
job is visible there immediately. Revisit when task 029 ships.

### Decision 6: the submit button is disabled while saving

`JobForm` gains an optional `isSubmitting` prop that disables the submit
button, and `NewJobPage` passes `isSaving`.

The task file does not ask for this, and it is the consequence it did not
anticipate. Submitting was synchronous and instant before this change, so
a double click was impossible. Against a real backend the POST takes long
enough to click twice, and `POST /api/jobs` has no idempotency key and no
duplicate detection, so two clicks create two jobs. `docs/context.md`
section 12 does plan duplicate detection, but for discovery and import,
not as a guard against a double-submitted form.

The existing `Button` already renders `disabled:cursor-not-allowed` and
`disabled:opacity-60`, so this needs no new styling.

**Rejected: leave it, and let task 035 handle it.** Task 035 is
"add optimistic updates where useful", which is a different concern; a
duplicate row is not an optimism problem. Nothing else in the queue owns
it, so leaving it would file a real defect against no task.

**Rejected: guard with `formState.isSubmitting`.** It is the idiomatic
React Hook Form answer and it avoids a prop. The probe above showed
`formState` is a proxy whose values depend on what the render touched,
and the page would then read pending state from one source and error
state from another. One source is worth one prop.

### Decision 7: the error renders above the form, from a new title key

`JobForm` gains an optional `error` slot rendered above the fields.
`NewJobPage` fills it with `ErrorState`, titled from a new
`jobForm.createErrorTitle` key and described by `error.message`.

This mirrors `JobsPage` exactly: a localized title the product owns, and
the service's message as the description. The message is already
localized by task 020's fallback keys or supplied by the backend.

`ErrorState` carries `role="alert"`, so it is announced when it appears,
which is what the task file's "API error is shown accessibly" asks for.
Placing it above the fields means the announcement and the fields the
user must fix are in the same reading order.

**Rejected: a field-level error via `setError('root')`.** The failure is
not about a field. A root error would either render in no field's slot or
be attached to an arbitrary one, and `ErrorState` already exists for
exactly this.

**Rejected: reusing `jobs.loadErrorTitle`.** "Saved jobs could not be
loaded" is wrong for a failed create, and one string serving two
unrelated failures is how copy rots. See bug 003.

### Decision 8: the provider's `createJob` stays, unused

After this change nothing in application code calls it. It stays.

Removing it means editing `jobsStore.types.ts`, `JobsProvider.tsx` and
its test, all of which still serve the dashboard, the detail page and the
edit form until tasks 025, 027, 028 and 029. Deleting one member of a
provider mid-migration is a refactor this task did not ask for, and
`AGENTS.md` section 0 rules out drive-by refactors. The provider's own
test keeps it covered, so no coverage gate moves.

### Decision 9: the remaining divergence is recorded, not papered over

After this task a created job reaches the backend and appears in the
list. It does **not** appear on the dashboard, which still reads
localStorage until task 025, and the detail page still cannot open it
until 029.

This narrows the task 024 divergence rather than closing it, and the
window is worth stating plainly. Writing to both the API and
localStorage would hide it, and would mean inventing a reconciliation
rule nobody specified, which the 024 plan already rejected for the same
reason.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobs/useCreateJob.ts` | the hook from decision 1 |
| `frontend/src/features/jobs/useCreateJob.test.tsx` | its test, against MSW |

`useCreateJob` shape:

| Member | Type | Purpose |
| --- | --- | --- |
| `saveJob` | `(payload: TJobFormPayload) => Promise<TJob>` | maps to a create request, posts, maps the response back |
| `error` | `AppError \| null` | the recorded failure, straight from request state |
| `isSaving` | `boolean` | `isLoading`; `idle` is **not** folded in here, unlike `useJobsList` |

`isIdle` is deliberately not treated as saving. `useJobsList` folds it in
because a fetch starts on mount and the table must not flash empty.
Nothing starts on mount here, so folding it in would disable the submit
button before the user ever pressed it.

### Changed files

| File | Change |
| --- | --- |
| `features/jobs/jobForm.utils.ts` | add `createJobFormFields`; rebuild `createJobFormPayload` on it |
| `features/jobs/components/JobForm.tsx` | optional `error` slot and `isSubmitting` prop |
| `features/jobs/index.ts` | export `useCreateJob` |
| `pages/jobs/NewJobPage.tsx` | drop `onSave`, use the hook, catch, render the error |
| `routes/modules/jobNewRoute.tsx` | render `<NewJobPage />`, drop `useJobs` |
| `i18n/locales/en.json`, `de.json` | add `jobForm.createErrorTitle` |

## Tests

### New: `useCreateJob.test.tsx`

Follows `useJobsList.test.tsx`: a small probe component, MSW handlers
declared per test because `setupTests.ts` errors on unhandled requests.

| Case | Asserts |
| --- | --- |
| posts the mapped body | the request body carries explicit nulls for omitted optional fields, read from the intercepted request |
| returns the mapped job | the resolved job has `undefined`, not `null`, for cleared fields, and the server's id |
| records a failure | a 500 leaves `error` set and the promise rejecting |

### Changed: `NewJobPage.test.tsx`

The `onSave` prop is gone, so the existing submit case changes from
asserting a spy to asserting the request. That is a behaviour change the
task intends, not a weakened assertion.

| Case | Asserts |
| --- | --- |
| renders an empty form | unchanged |
| successful submit creates and navigates | the POST body, then that the jobs route renders |
| validation still blocks submit | no request is made and the required-company message shows |
| an API failure keeps the values | the alert appears, the typed company is still in the field, and the route did not change |
| the submit button is disabled while saving | held-open handler, button disabled, then released |

The validation case is the one the task file asks for and the current
suite does not have: it must prove no request goes out, which
`onUnhandledRequest: 'error'` alone would not catch, since a blocked
submit makes no request either way. It asserts on a spy counting handler
invocations.

### Changed: `jobNewRoute.test.tsx`

Now renders a page that fetches nothing on mount, so it needs no
handler. It keeps asserting the heading and the submit button.

### Changed: `JobForm.test.tsx`

Two cases for the new props: the error slot renders its content, and
`isSubmitting` disables the submit button. Both optional, so the
existing cases stand unchanged.

## Implementation Order

1. Write this plan and link it from `docs/business/README.md`.
2. Add `createJobFormFields` and rebuild `createJobFormPayload` on it.
   Run `jobForm.utils.test.ts` and the edit page test. Both must pass
   untouched; if either moves, the rebuild changed behaviour it should
   not have.
3. Add `useCreateJob` and its test. Expect the failure case to be the
   fiddly one: the promise must reject *and* the error must be recorded,
   so the test has to catch the rejection or it fails as an unhandled
   one. That is decision 3 arriving in the test before the page.
4. Add the `error` and `isSubmitting` props to `JobForm`, with tests.
5. Rewrite `NewJobPage` to use the hook. Run its test **before** adding
   the new cases: the existing submit case must now fail, because the
   `onSave` spy is gone and no handler is declared, so MSW errors on an
   unhandled POST. That failure is the proof the page really posts.
6. Add the four `NewJobPage` cases, then thin `jobNewRoute` and fix its
   test.
7. Add the two locale keys.
8. `npm run frontend:verify`.
9. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/pages/jobs/NewJobPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend file changes, and
`AGENTS.md` section 3 asks for the app-level check for the app that
changed. The backend contract is untouched, so the Postman collection
needs no edit either.

The task file's own validation line is `npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No edit, delete or dashboard migration. Tasks 027, 028 and 025.
- No job detail page work, and no navigation to it. Task 029.
- No removal of any `JobsProvider` member.
- No new library. No data-fetching library, per `frontend/AGENTS.md` §5.
- No change to `jobFormSchema`, the validation messages, or the fields
  the form renders.
- No `useAsyncQuery` extraction. Task 024 deferred it until a second
  caller exists and its shape is known; this is a mutation, so it is not
  that caller.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/026-connect-add-job-form-to-backend.md` and set its
  status.
- Update `docs/backlog/phase-4-frontend-backend-integration.md` and move
  the recommended-next-task line on.
- Mark this plan `Completed` with a verified-state section.
- Update `docs/context.md` section 3, which currently says localStorage
  backs every job screen except the list.

## Acceptance Criteria

- [x] `/jobs/new` creates a job through `POST /api/jobs`.
- [x] Success navigates to the jobs list, where the new job appears.
- [x] A failed create keeps every entered value and announces the error.
- [x] Validation still blocks an invalid submit, and no request goes out.
- [x] A second click during a slow save cannot create a second job.
- [x] No `JobsProvider` member is removed and no unrelated file changes.
- [x] `npm run frontend:verify` passes.

## Verified State

Implemented and verified on the
`feat/task-026-connect-add-job-form-to-backend` branch.

- `useCreateJob` wraps `useAsyncMutation` over a module-level
  `postJobFields`, which maps form fields to a create request and posts
  them. `saveJob` resolves to the created job in the UI model.
- `NewJobPage` owns the hook, awaits the save inside a `try`, navigates
  to the jobs list only on success, and renders `ErrorState` in the
  form's new error slot on failure. `jobNewRoute` is a plain render.
- `JobForm` gained optional `error` and `isSubmitting` props. Both
  default to inert, so the edit page is untouched.
- `createJobFormFields` now holds the blank-to-undefined and
  salary-to-number normalization, and `createJobFormPayload` spreads it
  and adds the three server-owned fields. The edit path is unchanged.

Two failures were observed on the way, both planned.

Step 2 of the implementation order asked whether rebuilding
`createJobFormPayload` changed behaviour. It did not: the ten existing
cases across `jobForm.utils.test.ts`, `EditJobPage.test.tsx` and the old
`NewJobPage.test.tsx` passed untouched.

Step 5 asked for the old submit case to fail once the page really posted,
which is what proves the call is real rather than mocked away:

```text
FAIL  src/pages/jobs/NewJobPage.test.tsx > NewJobPage >
      submits a new job payload and returns to jobs
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{...} ]
Number of calls: 0
```

ESLint's `perfectionist/sort-imports` then rejected four files, and
Prettier one, both fixed by the repo's own `--fix` and `format` scripts.
Worth noting for the next task: this project's import order is semantic
rather than alphabetical, so hand-ordered imports in a new file are
likely to be wrong. Run `npm run frontend:lint:fix` before reading the
diff.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 110 test
files and 259 tests, coverage at 100 per cent of lines and functions,
and the production build succeeded.

This was also the first task after the working-tree line-ending pin
landed. The pre-commit Prettier check needed no `frontend:format`
workaround, which is the first direct evidence that the fix works.
