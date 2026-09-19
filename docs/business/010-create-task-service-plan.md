# Task 010 - Create Task Service Plan

Status: Completed

## Purpose

Add the business logic for a job's preparation tasks: list, create,
update, and delete, always through the parent job. Task 011 puts HTTP
routes in front of this service, so the contract chosen here is the one
the controller and, in phase 4, the frontend will build on. No routes,
DTOs, or schema changes are part of this task.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/010-create-task-service.md`
- `tasks/roadmap/011-create-task-controller.md`
- `docs/business/005-create-job-service-plan.md`
- `docs/business/008-create-task-entity-plan.md`
- `docs/business/009-create-task-repository-plan.md`
- `docs/business/bug-001-assigned-id-entities-merge-on-save-plan.md`

## Current State

- `Task` extends `AssignedIdEntity` with `jobId`, `title`, `status`,
  `dueDate`, `createdAt`, and `updatedAt`. Every column is `val`, and
  its KDoc says the first service to edit a task must turn the edited
  columns into `var`.
- `TaskRepository` has one finder,
  `findAllByJobIdOrderByCreatedAtAscIdAsc`.
- `V3__create_tasks_table.sql` gives `tasks.job_id` a `NOT NULL`
  foreign key to `jobs` with `ON DELETE CASCADE`. `due_date` is
  nullable.
- `JobService` and `DefaultJobService` are the pattern to follow:
  interface plus `@Service` implementation, commands in a `command`
  package, an injected UTC `Clock`, and `ApiException` for missing
  rows.
- `ApiErrorCode` has `JOB_NOT_FOUND` and no task code.
- `testsupport/tasks/TaskTestFixtures.kt` provides `createTaskEntity`.
- No task service, command, controller, or DTO exists.

## Decisions

### An interface with one default implementation

`TaskService` is an interface and `DefaultTaskService` implements it,
as the job service does.

The interface earns its place in task 011: `JobControllerTest` drives
the controller against `FakeJobService` from `testsupport/jobs`, and
the task controller test will want a `FakeTaskService` the same way.

Rejected: a single concrete class. It saves one file now and forces a
mock library or a real database into every controller test later.

### Every operation is scoped by the parent job

```kotlin
fun listTasks(jobId: UUID): List<Task>
fun createTask(jobId: UUID, command: CreateTaskCommand): Task
fun updateTask(jobId: UUID, taskId: UUID, command: UpdateTaskCommand): Task
fun deleteTask(jobId: UUID, taskId: UUID)
```

Update and delete take the job id as well as the task id. Tasks never
exist outside a job in this product, the frontend always has the job
id in hand when it acts on a task, and task 011 is expected to nest the
routes under `/api/jobs/{jobId}/tasks`. A service that looked tasks up
by id alone would let `/jobs/A/tasks/{a task of B}` edit B's task, and
the controller would have to remember to prevent it on every route.

Rejected: task-id-only update and delete. The task file requires parent
job boundaries to be respected, and a boundary enforced by each caller
is not one.

Rejected: a `getTask` read. The task file lists create, update, delete,
and list; no screen reads one task on its own. It belongs to the task
that first needs it.

### Scope the task lookup in the query with `findByIdAndJobId`

Add one finder to `TaskRepository`:

```kotlin
fun findByIdAndJobId(id: UUID, jobId: UUID): Task?
```

Task 009's plan named this finder as the likely next addition and left
it to the task that first needs it. This is that task.

Verified with a throwaway probe test against the H2 test database
before writing this down, then deleted: the derived query resolves, the
nullable return comes back `null` rather than throwing when nothing
matches, and a task queried with a different job's id also comes back
`null`.

Rejected: `findById` followed by comparing `task.jobId` in Kotlin. It
works, but the scoping then lives in whichever service method remembers
to compare. `backend/AGENTS.md` section 4 asks for ownership scoping to
be encoded in repository methods, and this is the same idea one level
down.

Rejected: returning `Optional<Task>`. `JobService` uses `orElseThrow`
only because `findById` is inherited from Java. A declared Kotlin
finder can return `Task?` and be read with `?: throw`.

### Check the parent job first, and let errors follow the path

Every operation first confirms the job exists, then looks up the task:

| Situation | Error |
| --- | --- |
| Job does not exist | 404 `JOB_NOT_FOUND`, "Job not found." |
| Job exists, task does not | 404 `TASK_NOT_FOUND`, "Task not found." |
| Job exists, task belongs to another job | 404 `TASK_NOT_FOUND` |

This reads like a URL. For `/jobs/{jobId}/tasks/{taskId}`, the first
missing segment is the one reported.

Listing tasks for a missing job throws `JOB_NOT_FOUND` rather than
returning an empty list. An empty list would look the same as a job
with no tasks, so a tasks tab left open on a job deleted in another tab
would quietly show nothing instead of reporting the job as gone.

Creating a task for a missing job needs the check most. Without it, the
insert breaks the foreign key when the transaction flushes and surfaces
as a `PersistenceException`, which `TaskPersistenceTest` already proves
(`rejects a task that references an unknown job`). The global handler
would turn that into a 500 `INTERNAL_ERROR` instead of a 404.

A task under the wrong job is reported as not found, not forbidden.
There are no users yet, so both jobs belong to the same person, and
under the requested job that task really does not exist.

Rejected: a distinct code such as `TASK_JOB_MISMATCH`. No client could
do anything useful with it, and once authentication exists it would
confirm that a task id exists under someone else's job.

Accepted: a job deleted between the check and the insert still fails
on the foreign key. Closing that gap needs locking, and it is not worth
it for a single-user tracker.

### Reuse `JobService.getJob` for the job check

`DefaultTaskService` depends on `JobService`, not `JobRepository`, and
calls `getJob(jobId)` for the existence check.

That keeps `JOB_NOT_FOUND` and its message built in exactly one place,
and the task domain depends on the job domain's public contract rather
than its storage. The cost is loading one job row where an existence
check would do, which does not matter here.

Rejected: `jobRepository.existsById` plus a copy of `jobNotFound()`.
Two copies of an error message drift.

Rejected: moving `jobNotFound()` somewhere shared. That refactors
`JobService` for no behaviour change, which is out of scope.

### Update replaces title, status, and due date together

`UpdateTaskCommand` has all three fields, and none is optional. The
service writes all three every time.

A partial update cannot express clearing the due date. `dueDate` is
nullable, so in a command where every field is optional, `null` has
to mean "leave it" and "remove it" at once. Separating the two needs a
three-state wrapper, which is real complexity for no current need.

The frontend's `IUpdateJobTaskInput` is partial today, but the one
caller, the done checkbox, already holds the whole `TJobTask` when it
fires, so phase 4 can send the full task. `UpdateJobCommand` is a full
replace for the same reasons.

Rejected: a partial, patch-style command.

### Create defaults to `TODO` with no due date

`CreateTaskCommand` requires `title` and defaults `status` to `TODO` and
`dueDate` to `null`, mirroring `CreateJobCommand` defaulting status to
`WISHLIST`.

The frontend's add-task form always sends a due date, but the column is
nullable by task 008's decision and `TaskPersistenceTest` persists a
task without one. Whether the API requires it is a request validation
question for task 011's DTO, and the service should not be stricter
than the schema.

### Timestamps, identity, and mutable columns

Create assigns `UUID.randomUUID()` and stamps `createdAt` and
`updatedAt` from the injected `Clock`. Update mutates the instance
`findByIdAndJobId` returned, refreshes `updatedAt`, and returns it
without calling `save`, as `DefaultJobService.updateJob` does.

That makes `title`, `status`, `dueDate`, and `updatedAt` `var` on
`Task`. `id`, `jobId`, and `createdAt` stay `val`: nothing moves a task
to another job or rewrites when it was created. The `Task` KDoc, which
describes the all-`val` state, is updated to say which columns are
editable and why, in the same form as `Job`'s.

Rejected: building a new `Task` with the same id to apply an update.
`AssignedIdEntity` makes that save fail on purpose; see bug 001.

### Task writes do not touch the parent job's `updatedAt`

Rejected: bumping the job's `updatedAt` whenever one of its tasks
changes. The jobs list and dashboard sort by `updatedAt` descending,
so ticking a task done would move its job to the top of both. That
may be what users want, but it is a product decision, and job activity
belongs to the timeline work in tasks 018 and 019.

### Title rules belong to the request DTO

The service does not check for a blank title or a maximum length. Job
field rules live on the request DTOs as Bean Validation annotations
backed by `JobFieldLimits`, and task 011 adds the task equivalents.
The column is `VARCHAR(255) NOT NULL`, so anything that slips past
validation still fails loudly.

Rejected: validating in the service too. Two sets of the same rules
disagree eventually.

### Delete loads the scoped task and deletes the entity

`deleteTask` checks the job, loads the task with `findByIdAndJobId`,
and passes it to `taskRepository.delete(task)`.

Rejected: `existsById` then `deleteById`, as `deleteJob` does.
`existsById` ignores the job, so the scoping would need a second
finder, `existsByIdAndJobId`, doing the same lookup as the one already
added.

### Every method is `@Transactional`

Each public method carries
`org.springframework.transaction.annotation.Transactional`, as in
`DefaultJobService`.

It matters most for update. Dirty checking only writes a change when
the transaction that loaded the entity commits. Without the annotation
the entity is detached as soon as the finder returns, and the mutation
is silently lost.

Note that `TaskServiceTest`, like `JobServiceTest`, is itself
`@Transactional`, so it cannot catch a missing annotation: the test's
own transaction keeps the entity managed. Task 012's end-to-end HTTP
tests are where that would surface.

## Proposed Change

### `ApiErrorCode`

Add `TASK_NOT_FOUND("TASK_NOT_FOUND")` in alphabetical position,
between `MALFORMED_REQUEST` and `VALIDATION_FAILED`. The global handler
already maps any `ApiException` by its code and status, so it needs no
change.

### Commands

Create `backend/src/main/kotlin/com/smartjobtracker/tasks/command/TaskCommands.kt`:

| Command | Field | Type | Default |
| --- | --- | --- | --- |
| `CreateTaskCommand` | `title` | `String` | none |
| | `status` | `TaskStatus` | `TaskStatus.TODO` |
| | `dueDate` | `LocalDate?` | `null` |
| `UpdateTaskCommand` | `title` | `String` | none |
| | `status` | `TaskStatus` | none |
| | `dueDate` | `LocalDate?` | none |

Neither carries `jobId`. The job comes from the method argument, and in
task 011 from the path, so it cannot disagree with the command body.

### Repository

Add `findByIdAndJobId(id: UUID, jobId: UUID): Task?` to
`TaskRepository`. It uses the primary key, so it needs no index.

### Entity

In `Task`, make `title`, `status`, `dueDate`, and `updatedAt` `var`,
and update the KDoc.

### Service

Create `backend/src/main/kotlin/com/smartjobtracker/tasks/TaskService.kt`
holding the `TaskService` interface and `DefaultTaskService`,
constructed with `TaskRepository`, `JobService`, and `Clock`. Private
helpers `now()` and `taskNotFound()` mirror the job service's.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/tasks/TaskServiceTest.kt`,
shaped like `JobServiceTest`: `@SpringBootTest`, `@Transactional`, a
fixed clock, and the service built by hand in `@BeforeEach` from
autowired repositories. Seed rows with `createJobEntity` and
`createTaskEntity`. Assert errors with `assertApiException`.

List:

- lists only the requested job's tasks, oldest first
- throws job not found when listing tasks for a missing job

Create:

- creates a task with `TODO`, no due date, the job id, and clock
  timestamps from a minimal command, and the row exists
- creates a task with the status and due date from a full command
- throws job not found when creating a task for a missing job

Update:

- replaces title, status, and due date, preserves id, job id, and
  creation time, and refreshes `updatedAt`
- clears the due date when the command's due date is `null`
- throws job not found when the job is missing
- throws task not found when the task is missing
- throws task not found for a task under another job, and leaves that
  task unchanged

Delete:

- deletes a task
- throws job not found when the job is missing
- throws task not found when the task is missing
- throws task not found for a task under another job, and that task
  still exists

The "under another job" cases are the ones that prove the boundary. A
service using plain `findById` passes every other test in this list.

The ordering itself is already proven in `TaskRepositoryTest`, so the
list test only needs two tasks with different creation times plus one
on another job.

Because the test class is transactional and rolls back, these tests
prove what the service returns and what the persistence context holds,
not that an update reaches the database after commit. Task 012's
end-to-end tests cover that.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Add `TASK_NOT_FOUND` and `TaskCommands.kt`. Nothing uses them yet,
   so `compileKotlin` is the only check.
3. Add `findByIdAndJobId` to `TaskRepository`. A misspelled property
   compiles, then fails every `@SpringBootTest` at context startup with
   "No property found for type Task", as task 009 found. Run
   `TaskRepositoryTest` to confirm the context still starts.
4. Write `TaskService` and `DefaultTaskService` **before** touching the
   entity. `updateTask` fails to compile with "Val cannot be reassigned"
   on each column it edits. That error is the reason for the next step.
5. Make the edited `Task` columns `var` and update its KDoc. The build
   compiles again.
6. Add `TaskServiceTest`. Run it alone first, then
   `npm run backend:test`.
7. Run the verification plan. A method or `?: throw` branch no test
   reaches fails the 100 per cent JaCoCo gate.
8. After verification passes, apply the completion rules.

## Verification Plan

Run, in order:

```bash
npm run backend:test:integration
```

```bash
npm run backend:verify
```

The integration run is required because this task changes an entity
and a repository (`AGENTS.md` section 3). All existing job and task
tests must pass unchanged, and ktlint, detekt, and the 100 per cent
line and branch coverage gate must hold.

## Scope Boundaries

- No controller, route, request DTO, response DTO, or OpenAPI change.
  Those are tasks 011 and 012.
- No `FakeTaskService`; task 011 adds it with the controller test that
  needs it.
- No `getTask` operation.
- No change to `JobService`, `DefaultJobService`, or the job's
  `updatedAt` on task writes.
- No database migration or schema change.
- No title or due date validation in the service.
- No authentication or user ownership rules.
- No note or timeline behaviour.
- No frontend changes.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 010's acceptance criteria.
- Tick task 010 in `docs/backlog/phase-3-backend-foundation.md`.
- Point "Current Recommended Next Task" in `docs/backlog/README.md` at
  task 011.
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [ ] `TaskService` owns task list, create, update, and delete logic.
- [ ] Every operation is scoped by the parent job, and a task under
      another job is reported as `TASK_NOT_FOUND`.
- [ ] Missing jobs and tasks raise `JOB_NOT_FOUND` and
      `TASK_NOT_FOUND` through `ApiException`.
- [x] `TaskServiceTest` covers each operation and each error path.
- [x] `npm run backend:test:integration` and `npm run backend:verify`
      pass before task completion is marked.

## Verified State

Implemented and verified on the `feat/task-010-create-task-service`
branch.

- `TaskService` and `DefaultTaskService` cover `listTasks`,
  `createTask`, `updateTask`, and `deleteTask`, each starting with
  `jobService.getJob(jobId)` so a missing job is reported before a
  missing task.
- `TaskRepository` gained `findByIdAndJobId(id, jobId): Task?`, scoping
  every task lookup to its parent job. A task queried under another
  job's id comes back `null`, exactly as verified with a throwaway
  probe test before this was written down (deleted afterwards).
- `ApiErrorCode.TASK_NOT_FOUND` joins `JOB_NOT_FOUND` for a task that is
  missing or belongs to a different job.
- `Task.title`, `.status`, `.dueDate`, and `.updatedAt` are now `var`;
  `updateTask` mutates the managed instance and relies on
  `@Transactional` dirty checking, with no explicit `save` call, the
  same pattern as `DefaultJobService.updateJob`.
- `TaskServiceTest` adds 14 cases: list ordering and its missing-job
  case; create with defaults and with a full command, plus its
  missing-job case; update replacing all fields, clearing the due
  date, and its missing-job, missing-task, and cross-job cases; delete
  and the same three error cases. The cross-job update and delete
  cases assert the other job's task is left untouched.
- `npm run backend:test:integration` passed (entity and repository
  change).
- `npm run backend:verify` passed: ktlint, detekt, all tests, and 100%
  JaCoCo line and branch coverage, including the new
  `com.smartjobtracker.tasks` and `com.smartjobtracker.tasks.command`
  packages.
