# Task 016 - Create Note Controller Plan

Status: Completed

## Purpose

Expose the task 015 service through Spring MVC routes nested under a
job: list, create, update, and delete a job's notes. This task adds
the controller, request/response DTOs, Bean Validation, and controller
tests. It does not hunt for CRUD gaps beyond what the controller itself
needs to work end to end; task 017 owns that, the same split task
011/012 used for tasks.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/016-create-note-controller.md`
- `tasks/roadmap/017-add-note-crud-endpoints.md`
- `docs/business/011-create-task-controller-plan.md`
- `docs/business/015-create-note-service-plan.md`

## Current State

- `NoteService` / `DefaultNoteService` exist with `listNotes(jobId)`,
  `createNote(jobId, command)`, `updateNote(jobId, noteId, command)`,
  and `deleteNote(jobId, noteId)`. Every method checks the job first
  and throws `JOB_NOT_FOUND` or `NOTE_NOT_FOUND` through `ApiException`.
- `TaskController` is the pattern to follow: `@RestController` mapped
  under `/jobs/{jobId}/tasks`, DTOs in a sibling `dto` package, Bean
  Validation on request DTOs, Springdoc `@ApiResponse` annotations
  documenting the error shape, and a `toCommand()` / `toResponse()`
  mapping extension per DTO.
- `ApiExceptionHandler` already converts `ApiException`,
  `MethodArgumentNotValidException`, and
  `MethodArgumentTypeMismatchException` into typed JSON responses, so a
  non-UUID `jobId`/`noteId` path segment is already `400
  INVALID_REQUEST_PARAMETER` with no controller-specific code, the same
  behavior task 011 verified for tasks.
- No note DTO, controller, or route existed before this task.

## Decisions

### Nest routes under the job, matching `TaskController`'s shape exactly

```text
GET    /jobs/{jobId}/notes
POST   /jobs/{jobId}/notes
PUT    /jobs/{jobId}/notes/{noteId}
DELETE /jobs/{jobId}/notes/{noteId}
```

Same reasoning as task 011: `NoteService`'s methods already take
`jobId` first, and the frontend always knows which job's notes tab it
is showing.

### One controller in the `notes` package

`NoteController` lives in `com.smartjobtracker.notes`, separate from
`JobController` and `TaskController`, matching how `NoteService` is
already its own class depending on `JobService`.

### No `getNote` route

`NoteService` deliberately left out a single-note read; the controller
does not add one either, for the same reason task 011 gave for tasks.

### Request DTOs mirror the service commands

`CreateNoteRequest` and `UpdateNoteRequest` live in `notes/dto`, each
with one field:

| DTO | Field | Type | Validation |
| --- | --- | --- | --- |
| `CreateNoteRequest` | `body` | `String` | `@NotBlank` |
| `UpdateNoteRequest` | `body` | `String` | `@NotBlank` |

No `@Size` limit: `notes.body` is `TEXT` in
`V4__create_notes_table.sql`, not a bounded `VARCHAR`, so there is no
column length to mirror. `TaskFieldLimits` exists because
`tasks.title` is `VARCHAR(255)`; nothing analogous applies here.

Unlike `UpdateTaskRequest`, no `requireNotNull` bridge is needed in
`toCommand()`: `body` is a non-nullable `String` on both the request
and the command, so there is no nullable-on-the-DTO,
non-nullable-on-the-command gap to cross.

### Response DTO has no `jobId`

`NoteResponse` fields: `id`, `body`, `createdAt`, `updatedAt`. No
`jobId`, matching `TaskResponse`'s own decision for the same reason:
every route already carries `jobId` in the path.

### Reuse the existing generic path-variable error handling

No change to `ApiExceptionHandler`. Verified by the same reasoning task
011 recorded: `MethodArgumentTypeMismatchException` fires for any
`@PathVariable` conversion failure, not one tied to a specific route.

## Proposed Change

### DTOs (`notes/dto`)

- `CreateNoteRequest.kt`: request data class plus `toCommand()`.
- `UpdateNoteRequest.kt`: request data class plus `toCommand()`.
- `NoteResponse.kt`: response data class plus `Note.toResponse()`.

### Controller

`backend/src/main/kotlin/com/smartjobtracker/notes/NoteController.kt`:

```text
@RestController
@RequestMapping("/jobs/{jobId}/notes")
class NoteController(private val noteService: NoteService) {
    GET    ""              listNotes(jobId)
    POST   ""               201 createNote(jobId, request)
    PUT    "/{noteId}"      updateNote(jobId, noteId, request)
    DELETE "/{noteId}"      204 deleteNote(jobId, noteId)
}
```

Each method is a one-line expression body, matching `TaskController`'s
style, with `@ApiResponse` for `404` (job or note not found) and `400`
(validation).

## Tests

### `NoteControllerTest`

Add `FakeNoteService` to `testsupport/notes/NoteTestFixtures.kt`,
matching `FakeTaskService`'s shape. Build `MockMvc` the same way
`TaskControllerTest` does: standalone setup, `LocalValidatorFactoryBean`,
`ApiExceptionHandler`.

Cover:

- successful list response, path `/jobs/{jobId}/notes`, with no
  `jobId` field in the response body
- successful create response with `201 Created`
- successful update response
- successful delete response with `204 No Content`
- blank `body` on create returns `400 VALIDATION_FAILED`
- blank `body` on update returns `400 VALIDATION_FAILED`
- service `JOB_NOT_FOUND` propagates as `404 JOB_NOT_FOUND`
- service `NOTE_NOT_FOUND` propagates as `404 NOTE_NOT_FOUND`
- a non-UUID `jobId` or `noteId` path segment returns `400
  INVALID_REQUEST_PARAMETER`

No unknown-status-value case exists for notes; `body` is a plain
string, not an enum, so there is no JSON deserialization failure mode
to cover the way `TaskControllerTest` covers an unknown `TaskStatus`.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Add `CreateNoteRequest`, `UpdateNoteRequest`, `NoteResponse`.
3. Add `NoteController`.
4. Add `FakeNoteService` to `testsupport/notes/NoteTestFixtures.kt`.
5. Add `NoteControllerTest`.
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

No entity, repository, or migration changes are made in this task.

## Scope Boundaries

- No frontend integration.
- No task or timeline routes.
- No `getNote` route.
- No change to `NoteService`, `DefaultNoteService`, `JobController`, or
  `TaskController`.
- No database migration or schema change.
- No authentication or user ownership rules.
- No AI answer-to-note behavior.
- No broad end-to-end CRUD hardening beyond controller-level behavior;
  task 017 owns remaining gaps.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 016's acceptance criteria.
- Tick task 016 in `docs/backlog/phase-3-backend-foundation.md` and
  point the recommended next task at task 017.
- Mark this plan `Completed` and add a verified-state section.
- Update `docs/context.md` Current API section to list the new note
  routes.

## Acceptance Criteria

- [x] Note controller routes exist under `/jobs/{jobId}/notes`.
- [x] Requests validate correctly.
- [x] Controller tests cover success and error behavior.
- [x] `npm run backend:verify` passes before task completion is
      marked.

## Verified State

Implemented and verified on the `feat/task-016-create-note-controller`
branch.

- `NoteController` maps `GET`/`POST /jobs/{jobId}/notes` and
  `PUT`/`DELETE /jobs/{jobId}/notes/{noteId}` to `NoteService`, with
  `201`/`204` status codes and `@ApiResponse` documentation matching
  `TaskController`'s conventions.
- `CreateNoteRequest`, `UpdateNoteRequest`, and `NoteResponse` live in
  `notes/dto`. `NoteResponse` omits `jobId`, matching `TaskResponse`'s
  precedent, corrected during review from an initial draft that
  included it.
- `FakeNoteService` was added to
  `testsupport/notes/NoteTestFixtures.kt`, matching `FakeTaskService`'s
  shape.
- `NoteControllerTest` adds 10 cases: list (asserting no `jobId` in the
  response), create, update, delete, blank body on create and on
  update, job-not-found, note-not-found, and two malformed-path-segment
  cases.
- `docs/context.md`'s Current API section now lists the four new note
  routes.
- `npm run backend:verify` passed: ktlint, detekt, all tests, and 100%
  JaCoCo line and branch coverage.
