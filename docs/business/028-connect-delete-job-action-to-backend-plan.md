# Task 028 - Connect Delete Job Action To Backend Plan

Status: Completed

## Purpose

Make the job detail page's delete action call `DELETE /api/jobs/{id}`
instead of removing the job from the localStorage provider. This is the
last write in the jobs workflow, and the last thing task 029 deferred:
it dropped the delete button because a local delete keyed by job id
matches nothing for a job that came from the API.

Deleting was synchronous and could not fail. Now it can, and unlike the
create and edit forms there is no field to return to and no value to
preserve — the page the action was taken from stops existing. That
decides three things the task file does not mention: when to navigate,
what a second click does, and what a 404 means.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/028-connect-delete-job-action-to-backend.md`
- `docs/business/026-connect-add-job-form-to-backend-plan.md`
- `docs/business/027-connect-edit-job-form-to-backend-plan.md`
- `docs/business/029-connect-job-detail-page-to-backend-plan.md`

## Current State

### The delete UI, and where it went

`JobDetailHeader` renders an icon-only delete button inside
`{onDeleteJob && ...}`, with `aria-label` from `jobDetail.deleteJob` and
a tooltip. It is the only delete control in the app; the jobs list has
no row action for it.

Before task 029 the page did this:

```ts
const handleDeleteJob = () => {
  onDeleteJob?.(job.id);
  navigate(APP_PATHS.JOBS);
};
```

One synchronous call into the provider, then navigate. Task 029 stopped
passing `onDeleteJob`, so the button is not rendered today, and the page
documents that task 028 restores it.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| the API call | `deleteJob(id)` from task 020, typed `Promise<void>` |
| async state | `useAsyncMutation`, with request-id race guarding |
| a not-found classifier | `isJobNotFoundError` from task 027 |
| a mutation hook to copy | `useCreateJob`, `useUpdateJob` |
| a double-submit guard to compare against | `NewJobPage` from task 026 |
| an error surface | `ErrorState`, with `role="alert"` |
| a localized failure message | `jobs.fallbackError.deleteJob` |
| the delete button and its accessible name | `JobDetailHeader` |

### Verified before writing this plan

**Deleting a job that does not exist answers 404, not 204.** Read from
`DefaultJobService.deleteJob`: it calls `existsById` and throws
`jobNotFound()` when the row is absent, which
`ApiExceptionHandler.handleApiException` turns into 404 `JOB_NOT_FOUND`.
So the endpoint is *not* idempotent in its status code, which is what
makes decision 3 necessary rather than theoretical.

**`DELETE` answering with no body is the contract, not a defect.** The
service is typed `Promise<void>` and `parseJsonResponse` resolves a 204
as `undefined`. The empty-response guard that `useCreateJob` and
`useUpdateJob` need must therefore **not** be copied here: there is no
entity to come back, and a guard on `response?.id` would reject every
successful delete.

## Decisions

### Decision 1: a `useDeleteJob` hook, and the page owns it

`useDeleteJob` wraps `useAsyncMutation(deleteJob)` and exposes
`deleteJob`, `error` and `isDeleting`. `JobDetailPage` calls it.

The route keeps owning the *load*, as it has since task 029, and the
page owns the mutation it renders the control for. That is now the rule
across the workflow: `NewJobPage` owns the create, `EditJobForm` owns
the update, and the route owns every read. Nothing about the delete
belongs to the route, which would have to pass a handler, a pending flag
and an error down just to forward them to the header.

The page's own tests gain MSW for the delete cases, exactly as
`EditJobPage`'s did for the save. The load states stay prop-driven.

**Rejected: the route owns it and passes three more props.** The page
already takes five. Eight props to render one button, with the outcome
decided one component away from the control, is worse than one hook.

**Rejected: no `void` guard on the response.** Covered above: for delete
an empty body is success, so the guard the sibling hooks need would
reject every one.

### Decision 2: navigate only after the server confirms

```ts
await deleteJob(job.id);
navigate(APP_PATHS.JOBS);
```

The old code navigated unconditionally because the call could not fail.
Keeping that order now would send the user to the jobs list, where the
job is still present because the server still has it, with nothing said
about why. That is the silent-no-op failure the last three reviews on
this workflow each caught once.

The jobs list refetches on mount, so arriving there after a confirmed
delete shows the list without the row. That is what satisfies "UI
updates after successful delete" — no cache to invalidate.

**Rejected: optimistic navigation with a rollback.** There is nothing to
roll back to. The page is gone and the list would have to be told to
re-add a row it never removed. Task 035 owns optimistic updates, and a
destructive action is the worst place to start.

### Decision 3: a 404 on delete is success, not a failure

If the delete answers 404 the job is already absent, which is the
outcome the user asked for. The page navigates to the jobs list rather
than reporting a failure, using `isJobNotFoundError` from task 027.

This is not a courtesy. It is the correct answer to the double-click
race described in decision 4, and to the ordinary case of two tabs open
on the same job.

**Rejected: report the 404 as an error.** The user would be told the
job could not be deleted while looking at a job that no longer exists,
and the only recovery offered would be to try again, which cannot
change the answer.

### Decision 4: the button reports busy, and an in-flight ref guards it

The delete button sets `aria-busy` and dims while its request is in
flight, and `JobDetailPage` holds an `isDeletingRef` the handler checks
and sets synchronously. The button is **not** disabled.

**Revised twice, both times by measurement.** The plan first argued from
task 026 that a ref was needed because a disabled button lands a render
too late. Removing each guard in turn disproved that:

| Guard removed | DELETE requests from two clicks |
| --- | --- |
| neither | 1 |
| the ref | 1 |
| the disabled button | 1 |
| both | 2 |

Task 026's submit awaited React Hook Form's validation before reaching
its mutation, so both clicks arrived before the pending state rendered.
Here the mutation is called from the click handler itself, so either
guard alone holds, and the ref was dropped as redundant.

Review then found the cost of the half that was kept: a focused element
that becomes disabled is blurred. A keyboard user who presses Enter on
Delete loses their place for the length of the request, and after a
failure has to tab in from the top of the page to reach the error that
was just announced. The task file asks to preserve keyboard
accessibility.

So the disable is gone and the ref is back. The button stays operable
and reports itself busy; the extra activation is ignored by the caller
rather than prevented by removing the control. `Button` is a plain `FC`
with no ref forwarding, so restoring focus after a disable was not
available without changing a shared component this task has no business
touching.

**Rejected: disable it and refocus it afterwards.** That needs
`forwardRef` on the shared `Button`, and it still leaves the gap between
disable and refocus.

**Rejected: `pointer-events-none` instead of `disabled`.** It blocks the
mouse and not the keyboard, so the ref would still be doing the work,
and it makes the control look inert to a sighted user while remaining
operable by keyboard.

### Decision 5: the failure renders above the header, and 404 never does

A failed delete renders an `ErrorState` above the header, titled from a
new `jobDetail.deleteErrorTitle`, mirroring where `JobForm` puts its
error.

The condition is deliberately not "an error exists":

```ts
const hasDeleteFailure = deleteError !== null && !isJobNotFoundError(deleteError);
```

A 404 records an error in request state before decision 3 navigates
away. Rendering on `deleteError` alone would leave whether the user sees
a flash of "Job could not be deleted" to React's batching of the
`setError` inside the hook and the `navigate` in the handler. Deciding
it in the condition makes the answer the same either way, and both sides
are testable.

**Rejected: swallow the 404 inside `useDeleteJob` and resolve.** It
would drop the condition from the page, and it makes the hook lie about
what the server said. The next caller of a delete — a bulk action, a
row action — may want to know.

### Decision 6: no confirmation step

The task file puts confirmation out of scope unless the UI already has
one, and it does not. One click still deletes.

This is worth stating rather than leaving implied, because the action is
now irreversible in a way it was not before: the local store kept the
row in localStorage, where the previous behaviour could be undone by not
writing the file out. A backend delete cannot be undone from the UI. The
scope boundary is the task file's to move, not this plan's.

### Decision 7: what is left local after this

`JobsProvider.deleteJob` loses its last caller, and with it the provider
has no writer called from application code at all. It stays, for the
third time and the last: after this task the only thing still reading it
is the dashboard, which is task 025. Whoever takes 025 can delete the
provider outright, and should.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobs/useDeleteJob.ts` | the hook from decision 1 |
| `frontend/src/features/jobs/useDeleteJob.test.tsx` | its test, against MSW |

### Changed files

| File | Change |
| --- | --- |
| `features/jobs/index.ts` | export `useDeleteJob` |
| `features/jobDetail/components/JobDetailHeader.tsx` | optional `isDeletingJob`, disabling the delete button |
| `pages/jobDetail/JobDetailPage.tsx` | own the hook, the ref, the handler and the error |
| `i18n/locales/en.json`, `de.json` | add `jobDetail.deleteErrorTitle` |

`useDeleteJob` shape:

| Member | Type | Purpose |
| --- | --- | --- |
| `deleteJob` | `(jobId: string) => Promise<void>` | `mutate`, straight through |
| `error` | `AppError \| null` | the recorded failure |
| `isDeleting` | `boolean` | `isLoading`; `idle` is not folded in |

## Tests

### New: `useDeleteJob.test.tsx`

| Case | Asserts |
| --- | --- |
| deletes the job at its url | the intercepted request method and path |
| records a failure | a 500 leaves `error` set and the promise rejecting |
| resolves on a 204 with no body | the empty body is not treated as a failure |

### Changed: `JobDetailPage.test.tsx`

The read-only case loses its delete assertion, because the button is
back. Its other assertions stand.

| Case | Asserts |
| --- | --- |
| deletes and returns to jobs | one DELETE at the job's url, then the jobs route |
| a failed delete stays and announces it | `role="alert"` with the delete title, still on the job |
| a 404 delete returns to jobs without an error | the jobs route, and no alert |
| two clicks send one delete | two `fireEvent.click` with no await, exactly one request |
| the delete reports busy without disabling | held-open handler, `aria-busy`, still focused |

The plan's own acceptance criterion "two clicks send one request" is
what decision 4 was measured against.

### Changed: `JobDetailHeader.test.tsx`

One case for `isDeletingJob` disabling the delete button.

## Implementation Order

1. Write this plan and link it from `docs/business/README.md`.
2. Add `useDeleteJob` and its test. Expect the 204 case to be the one
   that teaches: copying the sibling hooks' `response?.id` guard makes
   it fail, which is why decision 1 rejects the guard.
3. Add `isDeletingJob` to `JobDetailHeader`, with its case.
4. Wire `JobDetailPage`: hook, handler, error. Run the double-click case
   with the guard removed and watch it send two requests.
5. Check the 404 case fails with decision 3 removed, at an alert that
   should not be there.
6. Add the locale key in both locales.
7. `npm run frontend:verify`.
8. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/pages/jobDetail/JobDetailPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend file changes and no contract
change, so `AGENTS.md` section 3 asks for the app-level check for the app
that changed. The task file's own validation line is
`npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No confirmation modal. Decision 6.
- No dashboard migration. Task 025.
- No delete action on the jobs list. The task says wire the existing UI,
  and the list has none.
- No bulk delete.
- No removal of any `JobsProvider` member, for the reason in decision 7.
- No optimistic update or list cache. Task 035.
- No new library, per `frontend/AGENTS.md` section 5.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/028-connect-delete-job-action-to-backend.md` and set
  its status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md` and update the
  recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- Update `docs/context.md` section 3, which still lists the delete
  action among the screens reading localStorage.

### Review pass

Four findings, all applied.

**A rejected field was reported as a missing job.** `isJobNotFoundError`
counted 400 as gone, which is only safe on the load path: `GET`'s one
parameter is the id, but a write carries a body and 400 is also how the
backend rejects it. Measured with a probe: a `PUT` answering 400
`VALIDATION_FAILED` — what an 11-digit salary or a 256-character company
really gets, since the Zod schema enforces neither limit — made the edit
form announce "Job not found / Request validation failed." with a Back
to jobs button, for a job that exists. The exported helper is now 404
only; the loader keeps 400 inline, where it means the id cannot be a
UUID. The regression case fails against the old classifier.

**The delete button lost keyboard focus while deleting**, which is
decision 4 above.

Two comments contradicted the measurement they were written beside: the
header's JSDoc credited a ref that had been removed, and the
double-click case called itself "the case the disabled button cannot
catch". Both are corrected. They are not runtime defects, but each one
would have told the next reader that the guard actually holding the line
was cosmetic.

Verification after all four: 115 test files and 302 tests, 100 per cent
of lines (1008/1008) and functions.

### Second review pass

Three findings, all applied. Two shared one root cause: the client
modelled the backend's error body as `{ error?, message? }` when it
actually sends `{ code, message, fieldErrors[] }`, so every decision
about what a failure meant was being made from the HTTP status alone.

**Any 404 counted as a completed delete.** A 404 from a proxy or a
routing change never reached the controller, yet the page left for the
jobs list as though the job were gone, and the list then refetched and
still showed the row. `AppError` now carries `apiCode` from the parsed
body, and `isJobNotFoundError` matches `JOB_NOT_FOUND` rather than a
status. The loader matches `JOB_NOT_FOUND` or `INVALID_REQUEST_PARAMETER`
the same way. The regression case answers 404 with no body in the
backend's shape and fails against status matching, at "Unable to find
role=alert".

**A rejected field left the user stuck.** A 400 said only "Request
validation failed", naming no field, and that branch offered no way out.
Two edits: the form schema now carries the limits `JobFieldLimits.kt`
enforces, so an oversized value is caught per field before a request
goes out, and the error state offers Back to jobs whatever the failure
was. The new case types an 11-digit salary and asserts no request is
made.

This crosses task 027's scope boundary, which said not to touch
`jobFormSchema`. That boundary was written before the gap was known and
the gap is what this finding is; leaving the schema alone would have
meant shipping a form that can only fail with a message the user cannot
act on. The create form gets the same fix, since it shares the schema.

**The busy delete button still looked clickable.** Removing `disabled`
for the focus fix also removed `disabled:cursor-not-allowed`, so a
sighted user got pointer cursor and hover styling on a control whose
clicks the ref silently swallowed. It now also carries
`pointer-events-none`, which leaves keyboard activation working.

`getApiErrorMessage` was orphaned by the `createApiError` change and is
removed rather than left uncovered.

Verification after all three: 115 test files and 305 tests, 100 per cent
of lines (1013/1013) and functions.

### Third review pass

Two findings, both applied, and both left over from the previous pass.

**The salary limit mirrored the digit count but not the decimal places.**
`@Digits(integer = 10, fraction = 2)` has two halves and only one was
copied, so 70000.555 still reached the API and came back as the
unactionable 400 the limits exist to prevent. The check now reads the
decimal places from the number the request would carry rather than the
typed text, because `createJobFormFields` sends `Number(value)`: "1.5e3"
arrives as 1500 and is fine, while a magnitude small enough to keep its
exponent is not. The case fails without the check.

**`AppError`'s doc still recommended branching on `status`**, directly
above the field that replaced it for exactly that purpose. The two
paragraphs are swapped and rewritten: `apiCode` is what to branch on,
and `status` is for reporting. `status` keeps no production reader, and
that is now what the doc says rather than something a reader has to
discover.

Verification: 115 test files and 305 tests, 100 per cent of lines
(1018/1018) and functions.

A note for whoever picks up task 025. Three of the four review passes on
this branch found a comment that contradicted a decision the same branch
had measured, and the code was right every time. The rationale is worth
keeping, but the plan is a better home for it than a JSDoc block that
has to be re-edited whenever a decision moves.

## Acceptance Criteria

- [x] Deleting a job sends `DELETE /api/jobs/{id}`.
- [x] A confirmed delete returns to the jobs list, which no longer shows
      the job.
- [x] A failed delete keeps the user on the job and announces the
      failure accessibly.
- [x] A delete that answers 404 is treated as done, not as a failure.
- [x] Two clicks send one request.
- [x] The delete button keeps its accessible name and keyboard
      behaviour.
- [x] `npm run frontend:verify` passes.

## Verified State

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 115 test
files and 301 tests, 100 per cent of lines (1005/1005) and functions
(417/417), production build fine.

Branch coverage is 97.81 per cent. `JobDetailPage.tsx` line 71 is the
`instanceof AppError` rethrow, uncovered for the same reason the
identical lines in `NewJobPage.tsx` and `EditJobForm.tsx` are: the
branch runs only on a defect this code does not have.

### What was built

`useDeleteJob` wraps `useAsyncMutation(deleteJob)` with no
empty-response guard, because for delete an empty body is success.
`JobDetailPage` owns it, awaits the server before leaving for the jobs
list, treats a 404 as done, and renders a failure above the header.
`JobDetailHeader` gained `isDeletingJob`, which disables the delete
button.

### Failures observed deliberately

- Copying the sibling hooks' `response?.id` guard into `useDeleteJob`
  made `sends a delete to the job url and resolves on an empty 204`
  fail, which is the point of decision 1: a 204 has no entity to check.
- `treats a delete that answers 404 as done` fails with decision 3
  removed, at "Unable to find Jobs route" — the page stays put.
- `sends one delete when two clicks land before the button disables`
  fails only with **both** guards removed, at two calls instead of one.
  That measurement is what corrected decision 4.

### Changed from the plan

The in-flight ref the plan called for was built, measured to be
redundant, and removed. Decision 4 records the measurement and why task
026's reasoning does not transfer, rather than being quietly reworded.
