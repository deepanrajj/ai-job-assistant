# Task 008 - Create Task Entity Plan

Status: Completed

## Purpose

Add the second persisted tracker domain model: preparation tasks
attached to a saved job. This is the first table that references
another table, so it introduces a foreign key, its index, and a
deliberate decision about what happens to a job's tasks when the job is
deleted.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `docs/engineering/pr-review.md`
- `tasks/roadmap/008-create-task-entity.md`
- `docs/business/003-create-job-entity-plan.md`

## Current State

- `V2__create_jobs_table.sql` creates the `jobs` table; `V1` is the
  baseline. The next free version is `V3`.
- `com.smartjobtracker.jobs` holds the `Job` entity, `JobStatus`,
  repository, service, controller, and DTOs.
- No `tasks` package exists.
- `DefaultJobService.deleteJob` deletes a job with
  `jobRepository.deleteById(id)` and nothing else.
- The frontend already defines task status as `TODO` or `DONE`
  (`frontend/src/types/job/jobDetail.types.ts`).

## Decisions

### Reference the job by id, not by association

`Task` stores `jobId: UUID` rather than mapping a `@ManyToOne` `Job`
association. This matches the model described in `docs/context.md`
(`Task: id, jobId, ...`), keeps lazy loading, proxies, and N+1 query
risk out of the codebase, and keeps DTO mapping trivial. The repository
in task 009 can expose `findAllByJobId(...)`.

### Deleting a job deletes its tasks

The foreign key is declared `ON DELETE CASCADE`, so the database
removes a job's tasks when the job is removed. A preparation task has
no meaning without its job.

This is what `tasks/roadmap/008-create-task-entity.md` means by preserving job
deletion behaviour intentionally. Without a decision here, the new
foreign key would make `DELETE /api/jobs/{id}` fail with a constraint
violation as soon as a job had tasks, and the existing task 007
integration test would not catch it because the job it deletes has no
tasks.

Cascading in the schema also keeps this task in scope: no change to
`DefaultJobService` is required, and no `TaskRepository` is needed yet.

The alternative, deleting children explicitly in `DefaultJobService`,
was considered and rejected. The database runs a cascade inside the same
statement and transaction as the parent delete, so a failure anywhere in
it rolls the whole delete back; there is no state where the job is gone
and its tasks remain. Deleting children in the service is several
statements that are atomic only while `@Transactional` is present and
correct, and it has to be repeated for each of the seven child tables
the model in `docs/context.md` §5 plans.

Revisit this if deleting a job ever needs side effects the database
cannot roll back, such as removing an uploaded file, or if the product
wants soft deletion instead of removal.

### Due date is a calendar date, and optional

`due_date` is `DATE` mapped to `LocalDate`, not a timestamp. A due date
is a calendar day: "due on 25 August" means the same day regardless of
the reader's timezone, so an instant would add confusion rather than
precision. This is a deliberate contrast with `created_at` and
`updated_at`, which are instants and stay `TIMESTAMP WITH TIME ZONE`.

The column is nullable because a preparation task does not always have
a deadline. If the product decides every task must have one, a later
migration can tighten it.

## Proposed Schema

Create `V3__create_tasks_table.sql`:

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_tasks_job_id ON tasks (job_id);
```

Notes:

- Do not edit `V1` or `V2`. Flyway stores a checksum of applied
  migrations and editing one fails validation.
- The index on `job_id` ships in the same migration. "All tasks for job
  X" is the query this table exists to serve, and the database also
  consults the child table when a parent row is deleted
  (`docs/engineering/pr-review.md` §3.3).
- `status` is stored as text for the same reason as `jobs.status`:
  readable in the database and stable across enum ordering changes.

## Proposed Entity

Create the package `com.smartjobtracker.tasks` and add `Task.kt` with
the entity and a `TaskStatus` enum:

```text
UUID id
UUID jobId
String title
TaskStatus status
LocalDate? dueDate
OffsetDateTime createdAt
OffsetDateTime updatedAt
```

`TaskStatus` values are `TODO` and `DONE`, mapped with
`EnumType.STRING`, matching the frontend lifecycle.

Keep the entity free of behaviour and separate from any future API DTO,
as `Job` is.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/tasks/TaskPersistenceTest.kt`
following the shape of `JobPersistenceTest`:

- persist a task against a saved job and read every column back
- deleting the job removes its tasks, proving the cascade actually
  applies rather than being assumed from the DDL
- a task referencing an unknown job is rejected, proving the foreign key
  is enforced
- `TaskStatus` round-trips through its string name

The cascade and foreign-key cases are the ones worth having. They are
behaviour of this migration, not of Hibernate, and nothing else in the
suite would notice if the constraint were dropped.

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add `V3__create_tasks_table.sql`.
3. Add the `tasks` package with `Task` and `TaskStatus`.
4. Add `TaskPersistenceTest`.
5. Run `npm run backend:verify`.
6. After verification passes, update the task and backlog checkboxes and
   mark this plan `Completed` with a verified-state section.

## Verification Plan

Run:

```bash
npm run backend:verify
```

The Flyway test must continue to report no pending migrations, all
existing job tests must pass unchanged, and the 100 percent JaCoCo gate
must hold.

## Scope Boundaries

- No task repository, service, controller, DTO, or endpoint. Those are
  tasks 009 to 012.
- No change to `JobService`, `JobController`, or the job DTOs.
- No frontend integration.
- No authentication or user ownership rules.
- No note, timeline, contact, reminder, document, search, import,
  profile, entitlement, usage, or AI output tables.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 008 acceptance criteria complete.
- Mark task 008 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 009.
- Mark this plan `Completed` and add a short verified-state section.

## Acceptance Criteria

- [x] Task schema exists as a Flyway migration, with the `job_id` index.
- [x] Task entity maps the schema and references a job by id.
- [x] Deleting a job removes its tasks, proven by a test.
- [x] No task API is introduced yet.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the task 008 branch.

- `V3__create_tasks_table.sql` creates the `tasks` table with the
  cascading foreign key and `idx_tasks_job_id`.
- `com.smartjobtracker.tasks.Task` maps the schema and stores the job
  reference as a plain `jobId` column. `TaskStatus` is `TODO` or
  `DONE`, persisted by name.
- `TaskPersistenceTest` covers the column round trip, a task without a
  due date, the cascade, the foreign-key rejection, and the enum. Five
  tests.
- `npm run backend:verify` passes: ktlint, detekt, 63 tests, and the
  100 percent JaCoCo gate.

Note for future readers: the cascade test clears the persistence context
before re-reading. JPA does not know about database-level cascades, so
without the clear the deleted task would still be returned from
Hibernate's first-level cache and the test would wrongly fail.
