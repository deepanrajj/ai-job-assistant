# Bug 004 - Jobs List Rows Link To A Job Detail Page That Cannot Find Them

Status: Open
Severity: P1
Reported: max-effort review of the task 024 branch, pull request #22

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

Every row on the jobs list has a "View details" action, and every one of
them leads to "Job not found":

- The list renders jobs fetched from `GET /api/jobs`, whose ids are
  backend UUIDs.
- The job detail page resolves the id in the URL against the
  localStorage store, which never contains those ids.

## Reproduction

1. Start the stack with `npm run dev:compose`.
2. Create a job through the API, or through Swagger UI.
3. Open `/jobs`. The row appears.
4. Click the details action on that row.
5. The page reads "Job not found" with a "Back to jobs" button.

Every row fails this way. No row has ever worked since task 024.

## Expected And Actual

- Expected: the details action opens the job the row is showing.
- Actual: it opens the not-found error state, for every row.

## Root Cause

Task 024 moved one route to the API and left its neighbour behind, so
the application now has two id spaces:

- `frontend/src/routes/modules/jobsRoute.tsx:12` calls `useJobsList()`,
  which fetches from the backend. Ids are UUIDs.
- `frontend/src/features/jobs/jobs.config.tsx:119` builds each row's
  link from that id.
- `frontend/src/routes/modules/jobDetailRoute.tsx:25` still calls
  `useJobs()`, backed by `JobsProvider` and localStorage.
- `frontend/src/pages/jobDetail/JobDetailPage.tsx:41` does
  `jobs.find((savedJob) => savedJob.id === jobId)` and falls through to
  the not-found `ErrorState` at line 43.

`readStoredJobs` seeds from `mockJobDetails` when localStorage is empty,
whose ids are `job-001` through `job-006`. A backend UUID can never
match, so the lookup fails 100 per cent of the time rather than
intermittently.

Newly introduced by task 024, pull request #21 is unrelated. The task
024 plan documented the create, edit, delete and dashboard divergences
but not this one, which is the only one that breaks a control on the
page task 024 itself ships.

## Impact

- P1 and user-facing. The list's only row action is dead, so the jobs
  list is effectively read-only and the detail page is unreachable for
  any real job.
- Worse than the divergences the plan did record: those need the user to
  create or edit something first, this needs one click on the screen
  they land on.
- Invisible to the test suite, which is its own problem. The wire
  fixtures originally reused the `job-001` style ids of the localStorage
  seed data, so an API row and a store row collided by coincidence and
  the handoff appeared to work. The review fixes for pull request #22
  changed those fixtures to UUIDs, which removes the coincidence but
  does not add a test that would catch this.

## Proposed Fix

1. Move the job detail route onto the API, which is task 029's stated
   scope. `getJobById` already exists from task 020 and
   `mapJobResponseToJob` from task 023, so the read path is short. The
   complication is that `JobDetailPage` needs a `TJobDetail`, carrying
   tasks, notes, timeline and AI insights that no endpoint returns yet,
   and its mutation callbacks all write to the localStorage store. A
   half-move would swap a visible dead link for silently no-op note and
   task creation, which is worse. This is the correct fix and it wants
   its own task.
2. Hydrate `JobsProvider` from `GET /api/jobs` so both routes share one
   id space, keeping the local mutations. Smaller, but it makes the
   provider mirror backend rows into localStorage, where a row deleted
   on the server would linger. That is an architecture decision, not a
   bug fix.
3. Hide the row action until the detail page is migrated. Removes the
   dead end honestly and is a one-line change, at the cost of the
   list's primary affordance.

Approach 1 unless the gap needs closing before task 029 is scheduled,
in which case 3 is the honest stopgap.

## Scope

In scope:

- Making the jobs list's row action lead somewhere correct.
- A test that fails against the current code.

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries unless explicitly listed.
- Migrating create, edit or delete. Tasks 026 to 028.
- The dashboard. Task 025.

## Tests

A bug fix needs a test that **fails before the fix and passes after**.
Without one, nothing stops the defect returning.

- Regression test: render the jobs route against MSW, click a row's
  details action, and assert the detail page shows that job's company
  rather than the not-found state. It fails today because the fetched id
  is not in the store.
- Keep the fixture ids UUID-shaped. Reusing the localStorage seed ids is
  what hid this in the first place.
- Confirm existing tests still pass unchanged.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Verify the regression test actually fails against the unfixed code
  before fixing. A test that passes either way proves nothing.

## Validation

```bash
npm run frontend:verify
```

Then check it by hand against `npm run dev:compose`, because every test
here stubs the network and this defect is about two real data sources
disagreeing.

## Acceptance Criteria

- [ ] The symptom no longer reproduces.
- [ ] A regression test covers it and was seen to fail before the fix.
- [ ] Existing tests pass unchanged.
- [ ] Required verification passes.
- [ ] No unrelated files are changed.

## Commit

```text
bug-004: make jobs list rows reach the job they show
```
