# Task 015 - Create Note Service Plan

Status: Completed

## Purpose

Add the business logic for a job's notes: list, create, update, and
delete, always through the parent job. Task 016 puts HTTP routes in
front of this service, so the contract chosen here is the one the
controller and, later, the frontend will build on. No routes, DTOs, or
schema changes are part of this task.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/015-create-note-service.md`
- `tasks/roadmap/016-create-note-controller.md`
- `docs/business/010-create-task-service-plan.md`
- `docs/business/013-create-note-entity-plan.md`
- `docs/business/014-create-note-repository-plan.md`
- `docs/business/bug-001-assigned-id-entities-merge-on-save-plan.md`

## Current State

- `Note` extends `AssignedIdEntity` with `jobId`, `body`, `createdAt`,
  and `updatedAt`. `body` and `updatedAt` are already `var`; the
  entity's own KDoc explains why (an update mutates the managed
  instance rather than rebuilding it). No entity change is needed for
  this task, unlike task 010, which had to convert `Task`'s edited
  columns from `val` to `var` as part of the service work.
- `NoteRepository` has one finder,
  `findAllByJobIdOrderByCreatedAtAscIdAsc`. Its own plan (014) already
  named `findByIdAndJobId` as the likely next addition, left to the
  task that first needs it — this one.
- `V4__create_notes_table.sql` gives `notes.job_id` a `NOT NULL`
  foreign key to `jobs` with `ON DELETE CASCADE`.
- `TaskService` / `DefaultTaskService` is the pattern to follow:
  interface plus `@Service` implementation, an injected UTC `Clock`,
  `JobService.getJob` for the parent-job check, and `ApiException` for
  missing rows.
- `ApiErrorCode` has `JOB_NOT_FOUND` and `TASK_NOT_FOUND`, no note code.
- `testsupport/notes/NoteTestFixtures.kt` already provides
  `createNoteEntity` and `noteFixtureTimestamp`.
- No note service, command, controller, or DTO exists.

## Decisions

### An interface with one default implementation

`NoteService` is an interface and `DefaultNoteService` implements it,
matching `JobService` / `DefaultJobService` and `TaskService` /
`DefaultTaskService`.

The interface earns its place in task 016 the same way it did in task
011: the note controller test will want a `FakeNoteService`.

Rejected: a single concrete class, for the same reason task 010
rejected it — it forces a mock library or a real database into every
controller test later.

### Every operation is scoped by the parent job

```kotlin
fun listNotes(jobId: UUID): List<Note>
fun createNote(jobId: UUID, command: CreateNoteCommand): Note
fun updateNote(jobId: UUID, noteId: UUID, command: UpdateNoteCommand): Note
fun deleteNote(jobId: UUID, noteId: UUID)
```

Identical shape to `TaskService`, for the identical reason: notes never
exist outside a job in this product, the frontend always has the job id
in hand when it acts on a note, and task 016 is expected to nest routes
under `/api/jobs/{jobId}/notes`.

Rejected: a `getNote` read. The task file lists create, update, delete,
and list; no screen reads one note on its own.

### Scope the note lookup in the query with `findByIdAndJobId`

Add one finder to `NoteRepository`:

```kotlin
fun findByIdAndJobId(id: UUID, jobId: UUID): Note?
```

Verified with a throwaway probe test against the H2 test database
before writing this down, then deleted: the derived query resolves,
the nullable return comes back `null` when nothing matches, and a note
queried with a different job's id also comes back `null` — the same
behavior task 010 verified for `TaskRepository.findByIdAndJobId`.

Rejected: `findById` followed by comparing `note.jobId` in Kotlin, for
the same reason task 010 rejected it for tasks — the scoping would live
in whichever service method remembers to compare, not in the
repository.

### Check the parent job first, and let errors follow the path

Every operation first confirms the job exists, then looks up the note:

| Situation | Error |
| --- | --- |
| Job does not exist | 404 `JOB_NOT_FOUND`, "Job not found." |
| Job exists, note does not | 404 `NOTE_NOT_FOUND`, "Note not found." |
| Job exists, note belongs to another job | 404 `NOTE_NOT_FOUND` |

Same reasoning as task 010: listing notes for a missing job throws
`JOB_NOT_FOUND` rather than returning an empty list, so a notes tab
left open on a job deleted in another tab reports the job as gone
instead of quietly showing nothing. Creating a note for a missing job
needs the check to avoid a foreign-key failure surfacing as a 500. A
note under the wrong job is reported as not found, not forbidden, since
there is no ownership boundary yet.

Rejected: a distinct code such as `NOTE_JOB_MISMATCH`, for the same
reason task 010 rejected it for tasks.

### Reuse `JobService.getJob` for the job check

`DefaultNoteService` depends on `JobService`, not `JobRepository`, and
calls `getJob(jobId)` for the existence check, keeping `JOB_NOT_FOUND`
and its message built in exactly one place.

### Update replaces the note body

`UpdateNoteCommand` has one field, `body`, required. The service writes
it every time, plus `updatedAt`.

There is no optional-field ambiguity here the way there was for
`UpdateTaskCommand`'s nullable `dueDate` — a note has exactly one
editable field, so a full replace and a partial update are the same
operation.

### Create requires only a body

`CreateNoteCommand` has one field, `body`, required, with no default.
Unlike `CreateTaskCommand`, there is no status or due date to default.

### Timestamps and identity

Create assigns `UUID.randomUUID()` and stamps `createdAt` and
`updatedAt` from the injected `Clock`. Update mutates the instance
`findByIdAndJobId` returned, refreshes `updatedAt`, and returns it
without calling `save`, exactly as `DefaultTaskService.updateTask` and
`DefaultJobService.updateJob` do.

No entity column changes are needed: `body` and `updatedAt` are already
`var` on `Note` from task 013.

### Note writes do not touch the parent job's `updatedAt`

Rejected, for the same reason task 010 rejected it for tasks: job
activity from note edits belongs to the timeline work in tasks 018 and
019, not to this task.

### Body rules belong to the request DTO

The service does not check for a blank or over-length body. That is a
Bean Validation concern for task 016's request DTOs, matching how job
and task field rules live on the request DTOs, not the service.

### Delete loads the scoped note and deletes the entity

`deleteNote` checks the job, loads the note with `findByIdAndJobId`,
and passes it to `noteRepository.delete(note)`, matching
`DefaultTaskService.deleteTask`.

### Every method is `@Transactional`

Each public method carries
`org.springframework.transaction.annotation.Transactional`, as in
`DefaultTaskService` and `DefaultJobService`. It matters most for
update: dirty checking only writes a change when the transaction that
loaded the entity commits.

## Proposed Change

### `ApiErrorCode`

Add `NOTE_NOT_FOUND("NOTE_NOT_FOUND")` in alphabetical position,
between `MALFORMED_REQUEST` and `TASK_NOT_FOUND`. The global handler
already maps any `ApiException` by its code and status, so it needs no
change.

### Commands

Create `backend/src/main/kotlin/com/smartjobtracker/notes/command/NoteCommands.kt`:

| Command | Field | Type | Default |
| --- | --- | --- | --- |
| `CreateNoteCommand` | `body` | `String` | none |
| `UpdateNoteCommand` | `body` | `String` | none |

Neither carries `jobId`. The job comes from the method argument, and in
task 016 from the path.

### Repository

Add `findByIdAndJobId(id: UUID, jobId: UUID): Note?` to
`NoteRepository`. It uses the primary key, so it needs no index.

### Entity

No change. `Note.body` and `Note.updatedAt` are already `var`.

### Service

Create `backend/src/main/kotlin/com/smartjobtracker/notes/NoteService.kt`
holding the `NoteService` interface and `DefaultNoteService`,
constructed with `NoteRepository`, `JobService`, and `Clock`. Private
helpers `now()` and `noteNotFound()` mirror the task service's.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/notes/NoteServiceTest.kt`,
shaped like `TaskServiceTest`: `@SpringBootTest`, `@Transactional`, a
fixed clock, and the service built by hand in `@BeforeEach` from
autowired repositories. Seed rows with `createJobEntity` and
`createNoteEntity`. Assert errors with `assertApiException`.

List:

- lists only the requested job's notes, oldest first
- throws job not found when listing notes for a missing job

Create:

- creates a note with the job id, the command's body, and clock
  timestamps, and the row exists
- throws job not found when creating a note for a missing job

Update:

- replaces the body, preserves id, job id, and creation time, and
  refreshes `updatedAt`
- throws job not found when the job is missing
- throws note not found when the note is missing
- throws note not found for a note under another job, and leaves that
  note unchanged

Delete:

- deletes a note
- throws job not found when the job is missing
- throws note not found when the note is missing
- throws note not found for a note under another job, and that note
  still exists

The "under another job" cases are the ones that prove the boundary, as
in `TaskServiceTest`. The ordering itself is already proven by
`findAllByJobIdOrderByCreatedAtAscIdAsc`'s own tests, so the list test
only needs two notes with different creation times plus one on another
job.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Add `NOTE_NOT_FOUND` and `NoteCommands.kt`. Nothing uses them yet,
   so `compileKotlin` is the only check.
3. Add `findByIdAndJobId` to `NoteRepository`. A misspelled property
   compiles, then fails every `@SpringBootTest` at context startup with
   "No property found for type Note", as task 009 found for tasks. Run
   the existing note persistence test to confirm the context still
   starts.
4. Write `NoteService` and `DefaultNoteService`. Unlike task 010, this
   compiles immediately since `Note.body` and `.updatedAt` are already
   `var`.
5. Add `NoteServiceTest`. Run it alone first, then
   `npm run backend:test`.
6. Run the verification plan. A method or `?: throw` branch no test
   reaches fails the 100 per cent JaCoCo gate.
7. After verification passes, apply the completion rules.

## Verification Plan

Run, in order:

```bash
npm run backend:test:integration
```

```bash
npm run backend:verify
```

The integration run is required because this task changes a repository
(`AGENTS.md` section 3). All existing job and note tests must pass
unchanged, and ktlint, detekt, and the 100 per cent line and branch
coverage gate must hold.

## Scope Boundaries

- No controller, route, request DTO, response DTO, or OpenAPI change.
  Those are task 016 and its successor.
- No `FakeNoteService`; task 016 adds it with the controller test that
  needs it.
- No `getNote` operation.
- No change to `JobService`, `DefaultJobService`, or the job's
  `updatedAt` on note writes.
- No database migration or schema change.
- No body validation in the service.
- No authentication or user ownership rules.
- No AI answer-to-note behavior.
- No task or timeline behaviour.
- No frontend changes.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 015's acceptance criteria.
- Tick task 015 in `docs/backlog/phase-3-backend-foundation.md`.
- Point "Current Recommended Next Task" in `docs/backlog/README.md` at
  task 016.
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [ ] `NoteService` owns note list, create, update, and delete logic.
- [ ] Every operation is scoped by the parent job, and a note under
      another job is reported as `NOTE_NOT_FOUND`.
- [ ] Missing jobs and notes raise `JOB_NOT_FOUND` and `NOTE_NOT_FOUND`
      through `ApiException`.
- [x] `NoteServiceTest` covers each operation and each error path.
- [x] `npm run backend:test:integration` and `npm run backend:verify`
      pass before task completion is marked.

## Verified State

Implemented and verified on the `feat/task-015-create-note-service`
branch.

- `NoteService` and `DefaultNoteService` cover `listNotes`,
  `createNote`, `updateNote`, and `deleteNote`, each starting with
  `jobService.getJob(jobId)` so a missing job is reported before a
  missing note.
- `NoteRepository` gained `findByIdAndJobId(id, jobId): Note?`, scoping
  every note lookup to its parent job.
- `ApiErrorCode.NOTE_NOT_FOUND` joins `JOB_NOT_FOUND` and
  `TASK_NOT_FOUND` for a note that is missing or belongs to a different
  job.
- No entity change was needed: `Note.body` and `.updatedAt` were
  already `var` from task 013, so `updateNote` mutates the managed
  instance and relies on `@Transactional` dirty checking with no
  explicit `save` call, the same pattern as `DefaultTaskService`.
- `NoteServiceTest` adds 12 cases: list ordering and its missing-job
  case; create and its missing-job case; update replacing the body and
  its missing-job, missing-note, and cross-job cases; delete and the
  same three error cases. The cross-job update and delete cases assert
  the other job's note is left untouched.
- `npm run backend:test:integration` passed (repository change).
- `npm run backend:verify` passed: ktlint, detekt, all tests, and 100%
  JaCoCo line and branch coverage, including the new
  `com.smartjobtracker.notes.command` package additions.
