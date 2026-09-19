# Task 011 - Create Task Controller Plan

Status: Completed

## Purpose

Expose the task 010 service through Spring MVC routes nested under a
job: list, create, update, and delete a job's preparation tasks. This
task adds the controller, request/response DTOs, Bean Validation, and
controller tests. It does not hunt for CRUD gaps beyond what the
controller itself needs to work end to end; task 012 owns that.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/011-create-task-controller.md`
- `tasks/roadmap/012-add-task-crud-endpoints.md`
- `docs/business/006-create-job-controller-plan.md`
- `docs/business/010-create-task-service-plan.md`

## Current State

- `TaskService` / `DefaultTaskService` exist with `listTasks(jobId)`,
  `createTask(jobId, command)`, `updateTask(jobId, taskId, command)`,
  and `deleteTask(jobId, taskId)`. Every method checks the job first
  and throws `JOB_NOT_FOUND` or `TASK_NOT_FOUND` through `ApiException`.
- `JobController` is the pattern to follow: `@RestController` mapped
  under `/jobs` (public path `/api/jobs`, from
  `server.servlet.context-path=/api`), DTOs in a sibling `dto` package,
  Bean Validation on request DTOs, Springdoc `@ApiResponse` annotations
  documenting the error shape, and a `toCommand()` / `toResponse()`
  mapping extension per DTO.
- `ApiExceptionHandler` already converts `ApiException`,
  `MethodArgumentNotValidException`, `HttpMessageNotReadableException`,
  and `MethodArgumentTypeMismatchException` into typed JSON responses.
  Verified by reading it: `MethodArgumentTypeMismatchException` fires
  during argument resolution, before any handler method runs, for
  *any* `@PathVariable` that fails to convert - so a non-UUID `jobId`
  or `taskId` segment is already reported as `400
  INVALID_REQUEST_PARAMETER` with no controller-specific code. Nothing
  needs to be added for that case.
- No task DTO, controller, or route exists.
- The frontend's `TJobTask` type is `{ id, title, dueDate, status }`;
  it has no `jobId` field, because the frontend always reaches a task
  through its job.

## Decisions

### Nest routes under the job, as task 009's plan anticipated

```text
GET    /jobs/{jobId}/tasks
POST   /jobs/{jobId}/tasks
PUT    /jobs/{jobId}/tasks/{taskId}
DELETE /jobs/{jobId}/tasks/{taskId}
```

This is the shape task 009's plan named as the reason
`findByIdAndJobId` would eventually be needed, and it matches
`TaskService`'s signatures exactly: every method already takes
`jobId` first. A controller under `/tasks/{taskId}` alone would need
the job id from somewhere else - a query parameter or the request
body - for no benefit, since the frontend already knows which job's
tasks tab it is showing.

Rejected: flat routes (`/tasks`, `/tasks/{id}`) with `jobId` in the
body or a query parameter. It reads worse and does not match the
service's own parameter order.

### One controller in the `tasks` package, not a nested route inside `JobController`

Add `TaskController` in `com.smartjobtracker.tasks`, separate from
`JobController`, the same way `TaskService` is a separate class from
`JobService` even though it depends on it.

Rejected: adding task methods to `JobController`. `backend/AGENTS.md`
groups production code by domain package; a job controller method
returning task DTOs would cross that boundary for a resource with its
own entity, repository, and service already.

### No `getTask` route

Task 010 deliberately left out a single-task read, since nothing reads
one task in isolation. The controller does not add one either;
`AGENTS.md` says not to infer extra scope from a phase checklist item,
and the task file lists create/update/delete/list only.

### Request DTOs mirror the service commands, not the entity

`CreateTaskRequest` and `UpdateTaskRequest` live in
`tasks/dto`, following `CreateJobRequest` / `UpdateJobRequest`:

| DTO | Field | Type | Validation |
| --- | --- | --- | --- |
| `CreateTaskRequest` | `title` | `String` | `@NotBlank`, `@Size(max = 255)` |
| | `status` | `TaskStatus?` | none; omitted keeps the command's `TODO` default |
| | `dueDate` | `LocalDate?` | none |
| `UpdateTaskRequest` | `title` | `String` | `@NotBlank`, `@Size(max = 255)` |
| | `status` | `TaskStatus?` | `@NotNull`; nullable only so a missing value is a validation error, not a type error |
| | `dueDate` | `LocalDate?` | none; `null` clears the due date, matching `UpdateTaskCommand` |

`title`'s length limit mirrors `tasks.title VARCHAR(255) NOT NULL` from
`V3__create_tasks_table.sql`, the same reasoning `JobFieldLimits`
already documents for job columns. Add a `TaskFieldLimits.kt` holding
`MAX_TITLE_LENGTH = 255` rather than reusing job's
`MAX_SHORT_TEXT_LENGTH`: the two happen to share a value because both
columns are `VARCHAR(255)`, but they constrain different columns in
different tables, and job's constant is `internal` to the `jobs.dto`
package, not visible from `tasks.dto`.

`dueDate` needs no `@NotNull` on either DTO: the column is nullable,
`CreateTaskCommand` already defaults it to `null`, and
`UpdateTaskCommand` treats an explicit `null` as "clear it" per task
010's plan. No `@Digits`-style precision annotation applies to a date.

Rejected: reusing `JobFieldLimits`. Two DTO packages depending on each
other's internal constants for an incidental coincidence is worse than
one duplicated line.

### Update mapping needs the same `requireNotNull` bridge as jobs

`UpdateTaskRequest.status` is `TaskStatus?` so `@NotNull` can report a
missing value as `400 VALIDATION_FAILED` instead of a JSON type error;
`UpdateTaskCommand.status` is `TaskStatus` (never null), because
nothing valid ever calls it with a missing status once validation
passes. `toCommand()` bridges the two with
`requireNotNull(status) { "Status must not be null" }`, exactly as
`UpdateJobRequest.toCommand()` does. This is unreachable once
`@Valid` has run, and `JobRequestMappingTest` already exists to test
that unreachable branch directly, at the mapping level, bypassing
MockMvc. Add a `TaskRequestMappingTest` doing the same for
`UpdateTaskRequest`.

### Response DTO has no `jobId`

`TaskResponse` fields: `id`, `title`, `status`, `dueDate`, `createdAt`,
`updatedAt`. No `jobId`.

Every route already has `jobId` in its path, so repeating it in the
body is redundant, and it matches the frontend's existing `TJobTask`
shape (`id`, `title`, `dueDate`, `status`) plus the timestamps the
frontend does not currently model. `JobResponse` deliberately omits
`userId` for the same reason: a field the caller already knows or does
not need does not belong in the response.

### Reuse the existing generic path-variable error handling; add nothing new to `ApiExceptionHandler`

Confirmed by reading `ApiExceptionHandler.handleRequestParameterTypeMismatch`:
it is keyed on `MethodArgumentTypeMismatchException`, which Spring
raises for *any* `@PathVariable` that fails conversion, not one tied to
a specific route or parameter name. A `TaskController` method
declaring `@PathVariable jobId: UUID, @PathVariable taskId: UUID` gets
`400 INVALID_REQUEST_PARAMETER` for a malformed value in either
segment with no new code. This was verified by reading the handler's
own KDoc and the existing `JobControllerTest` cases
(`returns bad request when the get path id is not a uuid`) rather than
by guessing.

## Proposed Change

### DTOs (`tasks/dto`)

- `TaskFieldLimits.kt`: `internal const val MAX_TITLE_LENGTH = 255`.
- `CreateTaskRequest.kt`: request data class plus `toCommand()`, same
  optional-status pattern as `CreateJobRequest.toCommand()` (map, then
  `copy(status = status)` only when `status != null`).
- `UpdateTaskRequest.kt`: request data class plus `toCommand()` using
  `requireNotNull`.
- `TaskResponse.kt`: response data class plus `Task.toResponse()`.

### Controller

`backend/src/main/kotlin/com/smartjobtracker/tasks/TaskController.kt`:

```text
@RestController
@RequestMapping("/jobs/{jobId}/tasks")
class TaskController(private val taskService: TaskService) {
    GET    ""              listTasks(jobId)
    POST   ""               201 createTask(jobId, request)
    PUT    "/{taskId}"      updateTask(jobId, taskId, request)
    DELETE "/{taskId}"      204 deleteTask(jobId, taskId)
}
```

Each method is a one-line expression body calling the service and
mapping the result, matching `JobController`'s style. Annotate
`@ApiResponse` for `404` (job or task not found) and `400`
(validation) the same way `JobController` documents `JOB_NOT_FOUND`
and validation failures, reusing one shared description string for
"Job or task not found" since a single route can produce either code
depending on which is missing.

## Tests

### `TaskControllerTest`

Add `FakeTaskService` to `testsupport/tasks/TaskTestFixtures.kt`,
matching `FakeJobService`'s shape (handlers per method,
`lastRequested*` capture fields). Build
`MockMvc` the same way `JobControllerTest` does: standalone setup,
`LocalValidatorFactoryBean`, `ApiExceptionHandler`.

Cover:

- successful list response, path `/jobs/{jobId}/tasks`
- successful create response with `201 Created`, and status defaults
  to `TODO` when omitted from the request
- successful update response, including clearing `dueDate` with an
  explicit `null`
- successful delete response with `204 No Content`
- blank `title` on create returns `400 VALIDATION_FAILED`
- title longer than 255 characters returns `400 VALIDATION_FAILED`
- missing `status` on update returns `400 VALIDATION_FAILED`
- an unknown `status` value returns `400 MALFORMED_REQUEST` (JSON enum
  deserialization failure, same shape as the existing job case)
- service `JOB_NOT_FOUND` propagates as `404 JOB_NOT_FOUND`
- service `TASK_NOT_FOUND` propagates as `404 TASK_NOT_FOUND`
- a non-UUID `jobId` or `taskId` path segment returns `400
  INVALID_REQUEST_PARAMETER`

### `TaskRequestMappingTest`

One test: `UpdateTaskRequest.toCommand()` throws
`IllegalArgumentException` when `status` is `null`, mirroring
`JobRequestMappingTest`.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Add `TaskFieldLimits`, `CreateTaskRequest`, `UpdateTaskRequest`,
   `TaskResponse`. Nothing calls them yet, so only `compileKotlin`
   exercises them.
3. Add `TaskController`. This is the first thing that references the
   DTOs and `TaskService` together, so a mapping mismatch surfaces
   here.
4. Add `FakeTaskService` to `testsupport/tasks/TaskTestFixtures.kt`.
5. Add `TaskControllerTest` and `TaskRequestMappingTest`.
6. Run `npm run backend:test`, then `npm run backend:verify`.
7. After verification passes, apply the completion rules.

## Verification Plan

Run:

```bash
npm run backend:test
```

```bash
npm run backend:verify
```

No entity, repository, or migration changes are made in this task, so
`npm run backend:test:integration` is not required, but running it
costs little and confirms nothing in the existing task persistence
path regressed. All existing job, task, and AI tests must keep
passing, and the 100 percent JaCoCo gate must hold.

## Scope Boundaries

- No frontend integration.
- No note or timeline routes.
- No `getTask` route.
- No change to `TaskService`, `DefaultTaskService`, or `JobController`.
- No database migration or schema change.
- No authentication or user ownership rules.
- No broad end-to-end CRUD hardening beyond controller-level behavior;
  task 012 owns remaining gaps, the same split task 006/007 used for
  jobs.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 011's acceptance criteria.
- Tick task 011 in `docs/backlog/phase-3-backend-foundation.md` and
  point the recommended next task at task 012.
- Mark this plan `Completed` and add a verified-state section.
- Update `docs/context.md` Current API section to list the new task
  routes, the way task 006 added the job routes there.

## Acceptance Criteria

- [x] Task controller routes exist under `/jobs/{jobId}/tasks`.
- [x] Requests validate correctly, including the update `status`
      bridge and title length.
- [x] Controller tests cover success, validation, and missing job/task
      behavior.
- [x] `npm run backend:verify` passes before task completion is
      marked.

## Verified State

Implemented and verified on the `feat/task-011-create-task-controller`
branch.

- `TaskController` maps `GET`/`POST /jobs/{jobId}/tasks` and
  `PUT`/`DELETE /jobs/{jobId}/tasks/{taskId}` to `TaskService`, with
  `201`/`204` status codes matching `JobController`'s conventions, and
  `@ApiResponse` documentation for the `400`/`404` cases on every
  route, including `listTasks` (it can 404 on a missing job, so it
  documents that too).
- `CreateTaskRequest`, `UpdateTaskRequest`, and `TaskResponse` live in
  `tasks/dto`, with `TaskFieldLimits.MAX_TITLE_LENGTH = 255` mirroring
  the `tasks.title` column. `UpdateTaskRequest.toCommand()` bridges its
  nullable `status` to `UpdateTaskCommand`'s required one with
  `requireNotNull`, the same idiom `UpdateJobRequest` uses.
- No new code was needed for a malformed `jobId`/`taskId` path
  segment: `ApiExceptionHandler.handleRequestParameterTypeMismatch`
  already reports any failed `@PathVariable` conversion as `400
  INVALID_REQUEST_PARAMETER`, confirmed by reading the handler and by
  `TaskControllerTest`'s two path-segment tests.
- `FakeTaskService` was added to `testsupport/tasks/TaskTestFixtures.kt`,
  matching `FakeJobService`'s shape.
- `TaskControllerTest` adds 13 cases (list, create with and without a
  status, update including clearing the due date, delete, blank/overlong
  title, missing update status, unknown status value, job-not-found,
  task-not-found, and two malformed-path-segment cases).
  `TaskRequestMappingTest` adds the one direct test of the
  `requireNotNull` bridge, mirroring `JobRequestMappingTest`.
- `docs/context.md`'s Current API section now lists the four new task
  routes.
- `npm run backend:verify` passed: ktlint, detekt, all tests, and 100%
  JaCoCo line and branch coverage. `npm run backend:test:integration`
  also passed, run as a sanity check even though this task made no
  entity, repository, or migration change.
