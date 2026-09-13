# Task 027 - Connect Edit Job Form To Backend Plan

Status: Completed

## Purpose

Make `/jobs/:jobId/edit` load its job from `GET /api/jobs/{id}` and save
through `PUT /api/jobs/{id}`, instead of finding the job in the
localStorage provider and writing back to it.

Task 026 connected the create form and task 029 the detail page, so both
halves of this one have a precedent. What is new is that the form's
initial values now arrive **after** the first render. React Hook Form
reads `defaultValues` when the form mounts, so a form that mounts before
its job exists prefills blanks and keeps them.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/027-connect-edit-job-form-to-backend.md`
- `docs/business/026-connect-add-job-form-to-backend-plan.md`
- `docs/business/029-connect-job-detail-page-to-backend-plan.md`

## Current State

### How the edit page works today

```text
jobEditRoute.tsx   useParams -> jobId; useJobs() -> jobs + updateJob
EditJobPage        jobs.find(job => job.id === jobId)
                   useForm({ defaultValues: createJobFormDefaultValues(job) })
                   submit -> onSave(createJobFormPayload(values, job))
JobsProvider       updateJob writes the whole job into localStorage
```

Submitting is synchronous, so it cannot fail and there is nothing to
wait for. The page renders its own not-found state, already borrowing
`jobDetail.notFoundTitle` and `jobDetail.notFoundDescription`.

Since task 024 the list renders backend ids, so the `find` misses for
every real job. Task 029 made that unreachable from the detail page by
dropping the edit button until this task ships.

### What already exists and does not need building

| Need | What is there |
| --- | --- |
| both API calls | `getJobById` and `updateJob` from task 020 |
| form fields to request body | `mapJobToUpdateRequest` from task 023 |
| response to UI model | `mapJobResponseToJob` from task 023 |
| a loader with three failure states | `useJobDetail` from task 029 |
| a mutation hook to copy | `useCreateJob` from task 026 |
| an error slot and a pending flag on the form | `JobForm` from task 026 |
| values to fields, and fields to a payload | `jobForm.utils.ts` |
| localized failure messages | `jobs.fallbackError.getJob`, `updateJob` |

### Why `useJobDetail` cannot be used as it stands

It returns a `TJobDetail`, which is a `TJob` widened so the optional
fields are always present: an absent salary becomes `0` and an absent
description becomes `''`. `createJobFormDefaultValues` reads
`job.salaryMax !== undefined ? String(job.salaryMax) : ''`, so a job with
no salary would prefill **"0"** in both salary fields, and saving the
form back would write a real zero salary the user never typed.

The widening is right for a screen that only renders. It is wrong for
one that round-trips values through a form.

### Verified before writing this plan

**React Hook Form reads `defaultValues` once, at mount.** Checked with a
throwaway probe: a component rendering `useForm({ defaultValues })` and
then re-rendering with different `defaultValues` kept the first set in
`getValues()`. The probe was deleted. This is the whole reason for
decision 3.

**`createJobFormPayload` has exactly one caller in application code.** A
grep across `frontend/src` returns `EditJobPage.tsx:58` and the helper's
own unit test. After this task it has none.

## Decisions

### Decision 1: `useJob` is extracted, and `useJobDetail` wraps it

Task 029's hook splits in two. `useJob(jobId)` owns everything about the
request: the load on mount, the reload when the id changes, the
not-found statuses, the guard against a 2xx carrying no job, and the
mapped `TJob`. `useJobDetail` becomes a wrapper that widens that job
through `mapJobToJobDetail` and changes nothing else.

This is not a refactor for its own sake: the edit page is the second
caller, and it needs the narrower of the two shapes. The alternative is
two hooks doing the same request with the same four states.

**Rejected: give `useJobDetail` a flag, or export the raw job beside the
widened one.** One hook with two return shapes is harder to read than
two hooks, and every caller then carries a choice it does not care
about.

**Rejected: a second loader hook for the form.** The not-found statuses,
the empty-response guard and the request-id behaviour would exist twice
and drift the first time one of them is corrected.

### Decision 2: a `useUpdateJob` hook, mirroring `useCreateJob`

`saveJob(jobId, payload)` maps the fields to an update request, PUTs
them, and maps the response back. It exposes `error` and `isSaving`, and
guards a 2xx that carries no job exactly as `useCreateJob` does.

`useCreateJob` keeps its mutation function at module level so
`useAsyncMutation` hands back a stable `mutate`. This one takes two
arguments where `useAsyncMutation` passes one, so the payload is a
single object: `{ jobId, fields }`.

### Decision 3: the form mounts only once the job exists

`EditJobPage` renders loading, not-found, load-error, or the form, in
that order, exactly as `JobDetailPage` does. The form itself moves into
`EditJobForm`, a component colocated with the page, which owns
`useForm`, `useUpdateJob` and the submit.

The split is forced rather than stylistic. `useForm` cannot be called
conditionally, and its `defaultValues` are read once at mount, as
verified above. Mounting the form only when the job is there is what
makes the prefilled values the job's values.

**Rejected: call `useForm` with empty defaults and `reset` in an effect
when the job arrives.** It is the idiomatic React Hook Form answer and
it needs no second component. It also means the form briefly renders
empty, and a reload that answers while the user is typing would wipe
what they had typed. A component that mounts with its values has neither
problem.

**Rejected: keep the states in the route.** Task 029 put them in the
page and left the route thin. Two sibling routes doing it differently is
worse than one extra component.

### Decision 4: the page takes the same five props as `JobDetailPage`

`error`, `isLoading`, `isNotFound`, `job`, `onRetry`, with `jobEditRoute`
owning `useJob`. The loader lives in the route for the same reason it
does on the detail route: the route already reads the param, and the
page's own tests stay free of MSW.

### Decision 5: the submit sends fields, not a whole job

`createJobFormFields(values)` is the body, through
`mapJobToUpdateRequest`. `createJobFormPayload`, which adds an id and
both timestamps, is not used: the server owns all three, and on an
update it already has them.

`createJobFormPayload` stays in `jobForm.utils.ts` with no caller. It
keeps its own unit tests, so nothing moves in coverage, and removing a
helper while the dashboard and the delete action still have their own
tasks is the kind of mid-migration refactor `AGENTS.md` section 0 rules
out. Task 025 or 028 will decide its fate.

### Decision 6: no in-flight ref, unlike the create form

The submit button disables while saving, through the `isSubmitting` prop
`JobForm` already has. There is no ref.

Task 026 needed one because two clicks in the same tick both reached the
handler before the disabled button rendered, and two POSTs to
`/api/jobs` create two jobs. `PUT /api/jobs/{id}` addresses one job and
replaces every editable field, so sending the same body twice leaves
exactly the state one request would, and `useAsyncMutation` already
discards the stale response. The failure task 026's ref prevents does
not exist here.

### Decision 7: the copy the page already borrows stays borrowed

The edit page already titles its missing-job state from
`jobDetail.notFoundTitle` and `notFoundDescription`. The loading and
load-error states join them, from `jobDetail.loading` and
`jobDetail.loadErrorTitle`. All four describe the job, not the screen,
and the alternative is four duplicated strings across two locales that
have to be kept in step.

One new key, `jobForm.updateErrorTitle`, mirroring
`jobForm.createErrorTitle` from task 026. A failed save is not a failed
load, and one title serving both is how copy rots. See bug 003.

### Decision 8: what is still local after this

`JobsProvider.updateJob` loses its last caller and stays, as
`createJob` did in task 026. After this task the provider's writers are
all unused, which is a signal for whoever closes task 028: the provider
can be deleted once the dashboard reads the API too, and that is task
025's call to make, not this one's.

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `frontend/src/features/jobs/useJob.ts` | the loader from decision 1 |
| `frontend/src/features/jobs/useJob.test.tsx` | its test, against MSW |
| `frontend/src/features/jobs/useUpdateJob.ts` | the hook from decision 2 |
| `frontend/src/features/jobs/useUpdateJob.test.tsx` | its test |
| `frontend/src/pages/jobs/EditJobForm.tsx` | the form from decision 3 |

### Changed files

| File | Change |
| --- | --- |
| `features/jobs/useJobDetail.ts` | becomes a wrapper over `useJob` |
| `features/jobs/useJobDetail.test.tsx` | keeps the widening case; transport cases move to `useJob.test.tsx` |
| `features/jobs/index.ts` | export both new hooks |
| `pages/jobs/EditJobPage.tsx` | five props, four states, no store |
| `routes/modules/jobEditRoute.tsx` | own `useJob`, drop `useJobs` |
| `i18n/locales/en.json`, `de.json` | add `jobForm.updateErrorTitle` |

## Tests

### New: `useJob.test.tsx`

Takes the transport cases task 029 wrote against `useJobDetail`, because
that is where the behaviour now lives: the mapped job, a 404 and a 400
as not found, a 500 as a retryable error, a 2xx with no job as a
failure, a refetch when the id changes, and `reload`.

### Changed: `useJobDetail.test.tsx`

Keeps one case, that the loaded job arrives widened with empty
collections. Everything else it asserted is `useJob`'s and is tested
there. This is a move, not a deletion.

### New: `useUpdateJob.test.tsx`

| Case | Asserts |
| --- | --- |
| puts the mapped body | explicit nulls for cleared optional fields, read from the intercepted request, at the id's URL |
| returns the mapped job | nulls arrive as undefined |
| records a failure | a 500 leaves `error` set and the promise rejecting |
| rejects a 2xx with no job | a 204 records an error rather than resolving with nothing |

### Changed: `EditJobPage.test.tsx`

The page takes props rather than a job list, so its cases are expressed
against the new shape. The two behaviours it already asserted, prefilled
values and a submit that navigates, stay.

| Case | Asserts |
| --- | --- |
| prefills the loaded job | company, role and status from the job |
| a job with no salary prefills blank salaries | not "0", which is the widening trap |
| saves and returns to jobs | the PUT body and the jobs route |
| keeps the values when the save fails | the alert, and the typed company still in the field |
| disables the submit while saving | held-open handler |
| renders loading, not found, and load error | one case each, not found offering no retry |

### Changed: `jobEditRoute.test.tsx`

Now fetches. Declares a handler and asserts the fetched company reaches
the field.

## Implementation Order

1. Write this plan and link it from `docs/business/README.md`.
2. Extract `useJob`, make `useJobDetail` wrap it, and move the transport
   cases. Both hook tests and every detail-page test must pass with no
   assertion changed; if one moves, the extraction changed behaviour.
3. Add `useUpdateJob` and its test.
4. Split `EditJobForm` out of `EditJobPage` and give the page its four
   states. Run the page test **before** rewriting it: every case must
   fail against the removed props, which proves the page no longer
   reads the store.
5. Rewrite the page's cases. Add the no-salary case first and watch it
   fail against `useJobDetail`'s widened job, which is the trap decision
   1 exists for.
6. Rewire the route and its test.
7. Add `jobForm.updateErrorTitle` in both locales.
8. `npm run frontend:verify`.
9. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/pages/jobs/EditJobPage.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend file changes and no
contract change, so `AGENTS.md` section 3 asks for the app-level check
for the app that changed. The task file's own validation line is
`npm run frontend:verify`.

## Scope Boundaries

- No backend change, no new endpoint, no contract change.
- No add or delete migration, and no dashboard. Tasks 026, 028, 025.
- No change to `jobFormSchema`, the validation messages, or the fields
  the form renders.
- No removal of `createJobFormPayload` or of any `JobsProvider` member.
- No new library, per `frontend/AGENTS.md` section 5.
- No `useAsyncQuery` extraction. Still a refactor of `useJobsList` as
  well, and still not what this task asked for.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/027-connect-edit-job-form-to-backend.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md` and update the
  recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- Update `docs/context.md` section 3, which still lists the edit form
  among the screens reading localStorage.
- Restore the detail page's edit button, which task 029 dropped because
  this page could not open a backend job.

## Acceptance Criteria

- [x] The edit form prefills from `GET /api/jobs/{id}`.
- [x] A job with no salary prefills blank salary fields.
- [x] Saving sends `PUT /api/jobs/{id}` and returns to the jobs list.
- [x] A failed save announces the error and keeps every entered value.
- [x] A missing job and a malformed id render the not-found state.
- [x] A failed load renders the error state with a working retry.
- [x] `npm run frontend:verify` passes.

## Verified State

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 114 test
files and 290 tests, 100 per cent of lines (986/986) and functions
(413/413), production build fine.

Branch coverage is 97.92 per cent. `EditJobForm.tsx` line 84 is the
`instanceof AppError` rethrow, uncovered for the same reason the
identical line in `NewJobPage.tsx` is: the branch only runs on a defect
this code does not have.

### What was built

`useJob` loads a job as the API models it; `useJobDetail` is now a
wrapper that widens the same result. `useUpdateJob` mirrors
`useCreateJob` over `PUT`. `EditJobPage` chooses between loading,
not-found, load-error and the form, and `EditJobForm` owns the form and
the save. `jobEditRoute` owns the loader.

The detail page's edit button is back, which is what task 029 deferred
to this task, and that gives `APP_PATH_BUILDERS.jobEdit` its caller
again.

### Failures observed deliberately

- All three existing `EditJobPage` cases failed once the page stopped
  reading the store, which proves it really fetches.
- `leaves the salary fields blank for a job that has no salary` was run
  against a widened job and failed with the predicted value: expected
  null, received **0**. That is the trap decision 1 exists for, measured
  rather than argued.

The extraction in decision 1 was checked the other way round:
`useJobDetail.test.tsx`, every detail page case and the detail route
passed untouched before the tests were moved.

### Changed from the plan

The plan said the salary case would fail against `useJobDetail`. It is
not wired that way, so the failure was produced by passing a widened job
to the page directly and then reverted. The permanent case keeps its
value: it fails if anyone wires the widened shape into this route.

`EditJobPage.test.tsx` also gained a cancel case. `handleCancel` lost
its second caller when the not-found state moved to the page, and
nothing exercised it.
