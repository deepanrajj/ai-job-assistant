# Task 013 - Create Note Entity Plan

Status: Completed

## Purpose

Add the third persisted tracker domain model: free-text notes attached
to a saved job. This follows the same shape task 008 established for
tasks - a new table referencing `jobs`, its entity, and a deliberate
delete-cascade decision - but is simpler, since a note has no status
enum and no optional scheduling column.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/013-create-note-entity.md`
- `docs/business/008-create-task-entity-plan.md`

## Current State

- `V3__create_tasks_table.sql` is the latest migration; the next free
  version is `V4`.
- `com.smartjobtracker.tasks` holds `Task`, `TaskStatus`, and a full
  repository/service/controller/DTO stack (tasks 008-012).
- No `notes` package exists.
- `docs/context.md` section 5 defines the planned shape:
  `Note: id, jobId, body, createdAt, updatedAt`.
- `DefaultJobService.deleteJob` still deletes a job with
  `jobRepository.deleteById(id)` and nothing else; the `tasks` foreign
  key cascade already relies on this, and a new `notes` foreign key
  needs the same behaviour or job deletion breaks once a job has notes.

## Decisions

### Reference the job by id, not by association

`Note` stores `jobId: UUID` rather than a `@ManyToOne` `Job`
association, matching `Task` and the shape in `docs/context.md`. Same
reasoning as task 008: no lazy-loading/proxy risk, trivial DTO mapping
later, and the repository task 014 adds can expose
`findAllByJobId(...)`.

### Deleting a job deletes its notes

The foreign key is declared `ON DELETE CASCADE`, matching the `tasks`
table. A note has no meaning without its job, and this keeps
`DefaultJobService` and the existing job-deletion tests untouched -
exactly the reasoning task 008 already recorded for tasks. Rejecting
the alternative (deleting children explicitly in the service) for the
same reason: cascading keeps the delete atomic in one statement instead
of repeating a manual delete per child table as more child tables
arrive (notes now, timeline events next).

### No status or scheduling column

Unlike `Task`, a note has no lifecycle and no due date - `docs/context.md`
lists only `id, jobId, body, createdAt, updatedAt`. Adding either would
be scope the task file does not ask for ("Out of scope: ... AI
answer-to-note behavior" implies notes stay plain text for now).

### `body` has no length cap

`Task.title` is `VARCHAR(255)`, sized for a short label. A note is
free-form prose, so `body` is `TEXT` with no application-level cap. The
column stays `NOT NULL`; an empty note is a product/validation decision
for the controller task (016/017), not this one, so this task does not
add a blank-body test - there is no service or controller yet to reject
one, and a NOT NULL column already rejects a missing value.

## Proposed Schema

Create `V4__create_notes_table.sql`:

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_notes_job_id ON notes (job_id);
```

Notes:

- Do not edit `V1`-`V3`; Flyway checksums applied migrations.
- The index on `job_id` ships in the same migration, mirroring
  `idx_tasks_job_id`: "all notes for job X" is the query this table
  exists to serve, and the database also consults it on a parent-job
  delete.

## Proposed Entity

Create the package `com.smartjobtracker.notes` and add `Note.kt`:

```text
UUID id
UUID jobId
String body
OffsetDateTime createdAt
OffsetDateTime updatedAt
```

`id` and `jobId` and `createdAt` stay `val` (nothing moves a note to
another job or rewrites when it was created); `body` and `updatedAt`
are `var`, mirroring `Task`'s update-by-mutation pattern from
`backend/AGENTS.md` section 4, even though no service exists yet to
call it - the column is editable in the planned model
(`docs/context.md` §5 implies note edits), so it is declared `var` now
rather than requiring a second migration/entity change when the
service task adds updates.

Keep the entity free of behaviour, extending `AssignedIdEntity` exactly
as `Job` and `Task` do.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/notes/NotePersistenceTest.kt`
following the shape of `TaskPersistenceTest`:

- persist a note against a saved job and read every column back
- deleting the job removes its notes, proving the cascade actually
  applies
- a note referencing an unknown job is rejected, proving the foreign
  key is enforced

No status round-trip test is needed since `Note` has no enum column.

Add `backend/src/test/kotlin/com/smartjobtracker/testsupport/notes/NoteTestFixtures.kt`
with a `createNoteEntity(jobId, id, body, createdAt, updatedAt)` helper
and a fixed `noteFixtureTimestamp`, mirroring `TaskTestFixtures`. No
`FakeNoteService` yet - no service interface exists for this task to
fake.

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add `V4__create_notes_table.sql`.
3. Add the `notes` package with `Note`.
4. Add `NoteTestFixtures`.
5. Add `NotePersistenceTest`.
6. Run `npm run backend:test`, then `npm run backend:verify`.
7. After verification passes, update the task and backlog checkboxes
   and mark this plan `Completed` with a verified-state section.

## Verification Plan

Run:

```bash
npm run backend:test
npm run backend:verify
```

The Flyway test must continue to report no pending migrations, all
existing job and task tests must pass unchanged, and the 100 percent
JaCoCo line-and-branch gate must hold.

`backend:test:integration` is not needed beyond the unit run: this repo
has no separate integration-test source set keyed off entity changes -
`backend:verify` already runs the full suite, including
`NotePersistenceTest`, against the same database.

## Scope Boundaries

- No note repository, service, controller, DTO, or endpoint. Those are
  tasks 014-017.
- No change to `JobService`, `JobController`, or the job DTOs.
- No change to `Task`, `TaskService`, or any task file.
- No frontend integration.
- No authentication or user ownership rules.
- No timeline, contact, reminder, document, search, import, profile,
  entitlement, usage, or AI output tables.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 013 acceptance criteria complete.
- Mark task 013 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 014.
- Mark this plan `Completed` and add a short verified-state section.

## Acceptance Criteria

- [x] Note schema exists.
- [x] Note entity maps to a job.
- [x] No note API is introduced yet.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the task 013 branch.

- `V4__create_notes_table.sql` creates the `notes` table with the
  cascading foreign key and `idx_notes_job_id`, mirroring the `tasks`
  migration.
- `com.smartjobtracker.notes.Note` maps the schema, extends
  `AssignedIdEntity`, and stores the job reference as a plain `jobId`
  column. `body` and `updatedAt` are `var`; `jobId` and `createdAt` are
  `val`, matching `Task`'s update-by-mutation convention.
- `NoteTestFixtures.createNoteEntity` and `NotePersistenceTest` cover
  the column round trip, the cascade on job deletion, and the
  foreign-key rejection for an unknown job. Three tests; no enum
  round-trip case, since `Note` has no status column.
- `npm run backend:test` and `npm run backend:verify` both pass:
  ktlint, detekt, and the 100 percent JaCoCo line-and-branch gate all
  green.
