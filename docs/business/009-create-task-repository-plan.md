# Task 009 - Create Task Repository Plan

Status: Completed

## Purpose

Add repository access for the `Task` entity created in task 008. This
task introduces the smallest Spring Data surface the upcoming task
service needs: reading a job's tasks in a stable order. It exposes no
HTTP API and adds no service behaviour.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `docs/engineering/pr-review.md`
- `tasks/roadmap/009-create-task-repository.md`
- `docs/business/008-create-task-entity-plan.md`
- `docs/business/004-create-job-repository-plan.md`

## Current State

- `V3__create_tasks_table.sql` creates the `tasks` table with a
  cascading foreign key to `jobs` and `idx_tasks_job_id`.
- `com.smartjobtracker.tasks` holds `Task` and `TaskStatus`.
- `TaskPersistenceTest` covers the column round trip, the cascade, and
  the foreign key, with a private `newTask` helper.
- No task repository, service, or controller exists.
- `JobRepository` is the pattern to follow: an interface extending
  `JpaRepository` with one explicit derived finder.

## Decisions

### Order a job's tasks by creation time, ascending

The finder is `findAllByJobIdOrderByCreatedAtAsc`.

This matches what the UI shows today. `addStoredJobTask` in
`frontend/src/features/jobs/jobsStore.utils.ts` appends a new task to
the end of the list, so the tasks tab currently renders in creation
order. Ordering by due date would arguably suit a to-do list better,
but it would silently reorder every user's list when phase 4 swaps the
mock store for the API. Changing the order is a product decision and
belongs to a task that says so.

Ascending order is also why the finder is explicit rather than plain
`findAllByJobId`. Without an `OrderBy` clause the database may return
rows in any order, and "any order" tends to look stable in testing and
then change in production.

Note `due_date` is nullable, which is a second reason to avoid ordering
by it here: null ordering differs between databases and would need a
deliberate `NULLS FIRST` or `NULLS LAST` decision.

`id` is the tie-break, making the finder
`findAllByJobIdOrderByCreatedAtAscIdAsc`. Ordering by `created_at`
alone is only a partial order: task 010's service will stamp timestamps
from an injected `Clock`, and its tests will freeze that clock exactly
as `JobServiceTest` does, so every task created in one test shares an
instant and the database is free to return them in any order. A total
order costs one more clause and removes a class of flaky test.

### One finder only

`findAllByJobIdOrderByCreatedAtAsc` is the only custom method. Reading a
single task, saving, and deleting are all inherited from
`JpaRepository`.

`tasks/roadmap/009-create-task-repository.md` says to avoid adding unused
repository methods, so nothing speculative goes in.

A likely future addition is `findByIdAndJobId`, needed if task 011
exposes tasks under a nested route such as
`/api/jobs/{jobId}/tasks/{taskId}`, where reading a task should confirm
it belongs to the job in the path. That method belongs to the task that
first needs it, not this one.

## Proposed Repository

Create:

```text
backend/src/main/kotlin/com/smartjobtracker/tasks/TaskRepository.kt
```

An interface extending `JpaRepository<Task, UUID>` with one declared
method:

```kotlin
fun findAllByJobIdOrderByCreatedAtAsc(jobId: UUID): List<Task>
```

No `@Repository` annotation is needed; extending `JpaRepository` is
enough for Spring to create the bean.

The `idx_tasks_job_id` index shipped in task 008 serves the `job_id`
predicate. It does **not** cover the sort: the database matches on the
index and then sorts the matching rows separately. That is a deliberate
acceptance rather than an oversight — a job has a handful of tasks, so
sorting them costs nothing measurable, and a covering
`(job_id, created_at, id)` index would be three columns wide to save a
sort over single-digit row counts.

Revisit if tasks per job ever grow into the thousands, or if a later
task adds paging over this query. No migration is needed here.

## Test Support

Move the task builder out of `TaskPersistenceTest` into shared test
support:

```text
backend/src/test/kotlin/com/smartjobtracker/testsupport/tasks/TaskTestFixtures.kt
```

Add a `createTaskEntity(...)` factory with defaults for every field,
mirroring `createJobEntity` in `testsupport/jobs`. Update
`TaskPersistenceTest` to use it.

This is the fix the task 008 branch review asked for, applied one level
up: two tests now need to build a `Task`, so the builder belongs in
`testsupport` rather than being written twice
(`backend/AGENTS.md` §1, §6).

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/tasks/TaskRepositoryTest.kt`
following the shape of `JobRepositoryTest`:

- returns a job's tasks in creation order, seeded out of order so the
  assertion cannot pass by accident
- returns only the tasks belonging to the requested job, proving the
  `jobId` predicate actually filters
- returns an empty list for a job that has no tasks

The second case is the one that earns its keep. With a single job in the
database, a finder that ignored `jobId` entirely would still pass the
ordering test.

Do not retest inherited `JpaRepository` behaviour such as `save` or
`findById`; task 008 already proves the entity persists.

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add `TaskRepository`.
3. Add `createTaskEntity` in test support and switch
   `TaskPersistenceTest` to it.
4. Add `TaskRepositoryTest`.
5. Run `npm run backend:verify`.
6. After verification passes, update the task and backlog checkboxes and
   mark this plan `Completed` with a verified-state section.

## Verification Plan

Run:

```bash
npm run backend:verify
```

All existing job and task tests must pass unchanged, and the 100 percent
JaCoCo gate must hold.

## Scope Boundaries

- No task service, controller, DTO, or endpoint. Those are tasks 010 to
  012.
- No `findByIdAndJobId` or other finder until a caller needs it.
- No change to `JobRepository`, `JobService`, or the job DTOs.
- No database migration or schema change.
- No frontend integration.
- No authentication or user ownership rules.
- No note, timeline, or other domain repositories.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 009 acceptance criteria complete.
- Mark task 009 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 010.
- Mark this plan `Completed` and add a short verified-state section.

## Acceptance Criteria

- [x] `TaskRepository` compiles in the `tasks` package.
- [x] The only custom query is the job-scoped, creation-ordered finder.
- [x] Repository tests prove both the ordering and the job scoping.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the task 009 branch.

- `TaskRepository` extends `JpaRepository<Task, UUID>` with the single
  finder `findAllByJobIdOrderByCreatedAtAsc`.
- `createTaskEntity` now lives in `testsupport/tasks`, and
  `TaskPersistenceTest` uses it instead of a private builder.
- `TaskRepositoryTest` covers creation ordering, job scoping, and the
  empty case. Three tests.
- `npm run backend:verify` passes: ktlint, detekt, 66 tests, and the
  100 percent JaCoCo gate.

Note for future readers: a derived query name is resolved against the
entity's properties when the Spring context starts, not when the method
is called. A misspelled property fails every `@SpringBootTest` at
startup with "No property found for type Task", and `compileKotlin`
alone would not catch it.
