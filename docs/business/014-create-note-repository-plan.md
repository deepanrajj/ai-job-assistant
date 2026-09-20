# Task 014 - Create Note Repository Plan

Status: Completed

## Purpose

Add repository access for the `Note` entity created in task 013. This
introduces the smallest Spring Data surface the upcoming note service
needs: reading a job's notes in a stable order. It exposes no HTTP API
and adds no service behaviour, mirroring what task 009 did for `Task`.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/014-create-note-repository.md`
- `docs/business/009-create-task-repository-plan.md`
- `docs/business/013-create-note-entity-plan.md`

## Current State

- `V4__create_notes_table.sql` creates the `notes` table with a
  cascading foreign key to `jobs` and `idx_notes_job_id`.
- `com.smartjobtracker.notes` holds `Note`.
- `NotePersistenceTest` covers the column round trip, the cascade, and
  the foreign key, using `createNoteEntity` from `testsupport/notes`.
- No note repository, service, or controller exists.
- `TaskRepository` is the pattern to follow: an interface extending
  `JpaRepository` with one declared, job-scoped, totally-ordered finder.
  It later grew a second method, `findByIdAndJobId`, but only once
  task 011 (the controller) needed to look up a single task under a
  specific job; task 009 shipped with the one finder.

## Decisions

### Order a job's notes by creation time, ascending, with `id` as tie-break

The finder is `findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID)`,
identical in shape to `TaskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc`.

Same reasoning task 009 recorded for tasks: newest-first would arguably
suit a note feed better, but that is a product decision belonging to a
task that says so, not an incidental choice made while wiring the
repository. The `id` tie-break exists for the same reason: the note
service's upcoming `Clock` injection (mirroring `DefaultTaskService`)
will let tests freeze `createdAt`, so several notes can legitimately
share the same instant, and `created_at` alone is then only a partial
order. Without `id` as a second key, the database is free to return
those rows in any order, and "any order" is exactly the kind of thing
that looks stable in a small test table and breaks later.

### One finder only, `findByIdAndJobId` deferred

Only `findAllByJobIdOrderByCreatedAtAscIdAsc` is added now. No
`findByIdAndJobId`.

`tasks/roadmap/014-create-note-repository.md` explicitly warns against
unused repository methods, and this task has no caller for a
single-note-scoped-to-a-job lookup yet - that appears once a note
service or controller needs to update or delete a specific note under a
specific job, which is out of scope here (task 014's scope list
excludes controllers, and no note service exists yet either). Task 009
made the identical call for `TaskRepository`, and `findByIdAndJobId`
was added later, by the task that first needed it. Revisit this the
same way when the note service or controller task arrives.

## Proposed Repository

Create:

```text
backend/src/main/kotlin/com/smartjobtracker/notes/NoteRepository.kt
```

An interface extending `JpaRepository<Note, UUID>` with one declared
method:

```kotlin
fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<Note>
```

No `@Repository` annotation needed; extending `JpaRepository` is enough
for Spring to create the bean.

`idx_notes_job_id` (task 013) serves the `job_id` predicate; it does not
cover the sort, and that is the same deliberate acceptance task 009
recorded for `idx_tasks_job_id` - a job has a handful of notes, so
sorting the matched rows costs nothing measurable.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/notes/NoteRepositoryTest.kt`
following the shape of `TaskRepositoryTest`:

- returns a job's notes in creation order, seeded out of order
- orders notes sharing a creation instant by `id`
- returns only the notes belonging to the requested job
- returns an empty list for a job that has no notes

The job-scoping case is the one that earns its keep: with a single job
in the database, a finder that ignored `jobId` entirely would still
pass the ordering test.

Do not retest inherited `JpaRepository` behaviour such as `save` or
`findById`; task 013 already proves the entity persists.

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add `NoteRepository`.
3. Add `NoteRepositoryTest`.
4. Run `npm run backend:test`, then `npm run backend:verify`.
5. After verification passes, update the task and backlog checkboxes
   and mark this plan `Completed` with a verified-state section.

## Verification Plan

Run:

```bash
npm run backend:test
npm run backend:verify
```

All existing job, task, and note tests must pass unchanged, and the 100
percent JaCoCo line-and-branch gate must hold.

## Scope Boundaries

- No note service, controller, DTO, or endpoint. Those are tasks
  015-017.
- No `findByIdAndJobId` or other finder until a caller needs it.
- No change to `TaskRepository`, `JobRepository`, or their entities.
- No database migration or schema change.
- No frontend integration.
- No authentication or user ownership rules.
- No timeline or other domain repositories.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 014 acceptance criteria complete.
- Mark task 014 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 015.
- Mark this plan `Completed` and add a short verified-state section.

## Acceptance Criteria

- [x] `NoteRepository` compiles in the `notes` package.
- [x] The only custom query is the job-scoped, creation-ordered finder.
- [x] Repository tests prove both the ordering and the job scoping.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the task 014 branch.

- `NoteRepository` extends `JpaRepository<Note, UUID>` with the single
  finder `findAllByJobIdOrderByCreatedAtAscIdAsc`, matching
  `TaskRepository`'s shape exactly.
- `NoteRepositoryTest` covers creation ordering, the `id` tie-break for
  notes sharing a creation instant, job scoping, and the empty case.
  Four tests.
- `npm run backend:test` and `npm run backend:verify` both pass:
  ktlint, detekt, and the 100 percent JaCoCo line-and-branch gate all
  green.
