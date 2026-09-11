# Bug Tickets

Defects found in review, testing, or use. These are execution-ready in
the same way numbered tasks are, but they are not roadmap work: they
belong to no phase and can be scheduled whenever. Rules shared with
roadmap tasks live in `../README.md`.

## Convention

- Files live in `tasks/bugs/bug-<number>-<slug>.md`.
- Numbering is its own sequence starting at `bug-001`, independent of
  the roadmap numbers in `tasks/`. A defect never consumes a task
  number, and the two sequences cannot collide.
- Use `../../templates/bug-template.md` for new bug files.
- Branch name: `fix/bug-<number>-<slug>`.
- Commit message: `bug-<number>: <one-line summary>`.
- Bugs are not listed in `../../docs/backlog/` phase files. That folder
  tracks the roadmap; this file is the index for defects.

## Rules

- One bug per file. Two symptoms with one root cause are one bug; one
  symptom with two causes is two.
- Record the root cause as a code path, not a guess. Write "not yet
  diagnosed" when it is unknown, and make diagnosis the first step.
- Every fix needs a regression test that **fails before the fix**. Verify
  that it fails; a test that passes either way proves nothing.
- Note whether a defect is pre-existing or newly introduced. It changes
  how urgent it is and who should decide.
- A defect found during review that is cheap and in scope should be
  fixed in that change instead of filed here. File a bug when the fix is
  out of scope, needs its own decision, or is larger than the change
  that found it.

## Open

- [ ] [Bug 004: jobs list rows link to a job detail page that cannot
      find them](./bug-004-jobs-list-rows-link-to-a-job-detail-page-that-cannot-find-them.md)
      — P1, from the task 024 branch review. The list reads the API while
      the detail page still resolves ids against localStorage, so every
      row's details action lands on "Job not found".
- [ ] [Bug 003: the jobs search placeholder still offers to search by
      skill](./bug-003-jobs-search-placeholder-still-offers-skill.md)
      — nit, found while planning task 024. Task 023 removed `tags` from
      the search text but left both locale placeholders advertising it,
      so the box invites a search that matches nothing.

## Fixed

- [x] [Bug 002: a non-UUID path id returns 500 instead of 400](./bug-002-non-uuid-path-id-returns-500.md)
      — P2, from the task 020 branch review. Pre-existing since task
      006 and surfaced by the new job service. Fixed with a
      `MethodArgumentTypeMismatchException` handler returning 400 and a
      new `INVALID_REQUEST_PARAMETER` code.
- [x] [Bug 001: assigned-id entities take the merge path on save](./bug-001-assigned-id-entities-merge-on-save.md)
      — P2, from the task 009 branch review. Fixed with a shared
      `AssignedIdEntity` mapped superclass implementing `Persistable`.
