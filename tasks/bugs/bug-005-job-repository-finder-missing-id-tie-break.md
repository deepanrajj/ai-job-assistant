# Bug 005 - JobRepository's List Finder Has No Id Tie-Break

Status: Fixed
Severity: nit
Reported: found while reviewing repository conventions during task 014
(note repository) planning

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

`JobRepository.findAllByOrderByUpdatedAtDesc()` orders jobs by
`updatedAt` only. Two jobs that share the same `updatedAt` instant can
come back in either order from one call to the next, because
`ORDER BY updated_at DESC` alone is not a total order.

`TaskRepository` and `NoteRepository` both avoid this: their finders
are `findAllByJobIdOrderByCreatedAtAscIdAsc`, with `id` as an explicit
second sort key. `JobRepository` predates that convention (task 004,
before task 009 introduced the tie-break) and was never brought in
line with it.

## Reproduction

1. Persist two jobs with the same `updatedAt` value (for example, both
   built from one frozen `OffsetDateTime`).
2. Call `jobRepository.findAllByOrderByUpdatedAtDesc()`.
3. The relative order of the two jobs is whatever the database happens
   to return for two rows with an equal sort key - not guaranteed
   stable, and not asserted by any existing test.

## Expected And Actual

- Expected: the finder returns a total order, so two jobs sharing an
  `updatedAt` come back in a deterministic, test-provable order.
- Actual: the order for tied rows is unspecified.

## Root Cause

`backend/src/main/kotlin/com/smartjobtracker/jobs/JobRepository.kt:7` -
`findAllByOrderByUpdatedAtDesc()` sorts on one column. Pre-existing
since task 004; not introduced by task 014. Task 009 identified and
fixed the same gap for `Task` by adding an `id` tie-break, but nothing
carried that fix back to `JobRepository` since it was already shipped
and outside task 009's scope.

## Impact

- Low likelihood in practice: the service (task 005) stamps `updatedAt`
  from a real clock outside tests, so two jobs sharing the exact same
  instant is rare in production. Frozen-clock tests are where this
  actually bites.
- No test currently exercises the tied case, so nothing would catch a
  regression that made the order worse (e.g. a future index change).
- Pre-existing, not newly introduced by task 013/014.

## Proposed Fix

1. Change the finder to `findAllByOrderByUpdatedAtDescIdAsc()`,
   matching the ascending-`id` tie-break convention `Task` and `Note`
   already use, and update the one caller
   (`DefaultJobService.listJobs`, if it references the method name
   directly) and `JobRepositoryTest`.

Only one sensible option: this brings `JobRepository` in line with the
convention the other two repositories already use, rather than
inventing a different tie-break direction for jobs alone.

## Scope

In scope:

- The one finder method name and its regression test.
- A KDoc comment on the finder, matching `TaskRepository`'s, since that
  was also missing.

Out of scope:

- No change to `Task` or `Note` repositories.
- No change to `JobService`, `JobController`, or job DTOs beyond the
  finder call site if the method name changed there.
- No unrelated refactors or formatting.
- No new libraries.

## Tests

A bug fix needs a test that **fails before the fix and passes after**.

- Regression test: in `JobRepositoryTest`, persist two jobs with the
  identical `updatedAt` and two known `id` values, and assert the
  returned order matches ascending `id`. Verified this fails against
  the unfixed `findAllByOrderByUpdatedAtDesc()` in H2 (rows came back
  in insertion order, not `id` order, for the chosen ids), so the
  assertion is meaningful rather than coincidentally already true.
- Confirm the existing `` `returns jobs ordered by most recently
  updated first` `` test still passes unchanged.

## Validation

```bash
npm run backend:verify
```

## Acceptance Criteria

- [x] The symptom no longer reproduces.
- [x] A regression test covers it and was seen to fail before the fix.
- [x] Existing tests pass unchanged.
- [x] Required verification passes.
- [x] No unrelated files are changed.

## Commit

```text
bug-005: add an id tie-break to JobRepository's list finder
```
