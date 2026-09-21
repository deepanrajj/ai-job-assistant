# Task 017 - Add Note CRUD Endpoints Plan

Status: Completed

## Purpose

Task 017's file frames it as closing CRUD gaps left by tasks 013-016:
list, create, update, delete, and their error paths. Before writing any
code, audit what tasks 013-016 actually shipped against that list and
add only what is genuinely missing. This is the same task pair split
006/007 used for jobs and 011/012 used for tasks, repeated for notes:
task 016 shipped the routes, task 017 proves they are wired together
end to end and that the surface a client actually calls (HTTP, not
just controller-level `MockMvc`) is covered.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/017-add-note-crud-endpoints.md`
- `docs/business/012-add-task-crud-endpoints-plan.md`
- `docs/business/016-create-note-controller-plan.md`
- `docs/api/README.md`

## Current State

Read `NoteController`, `DefaultNoteService`, `NoteControllerTest`,
`NoteServiceTest`, and the notes persistence coverage end to end before
writing this plan. All four routes task 017 lists already exist and
are already tested at the controller and service layers:

- `GET /jobs/{jobId}/notes` - list, including the missing-job 404.
- `POST /jobs/{jobId}/notes` - create, including blank body and
  missing-job 404.
- `PUT /jobs/{jobId}/notes/{noteId}` - update, including blank body,
  missing-job 404, missing-note 404, and the cross-job case.
- `DELETE /jobs/{jobId}/notes/{noteId}` - delete, including missing-job
  404, missing-note 404, and the same cross-job case.

`npm run backend:verify` passes clean on this branch with 100 percent
JaCoCo line and branch coverage before this task changes anything.
Every layer already has an isolated test: controller
(`NoteControllerTest`, standalone `MockMvc` + fake service) and service
(`NoteServiceTest`, real repository via `@SpringBootTest`).

Two real gaps remain, found the same way task 012 found them for
tasks:

1. **No full-stack integration test.** `TaskCrudIntegrationTest` (task
   012) is the pattern: `@SpringBootTest` + `@AutoConfigureMockMvc` +
   `@Transactional`, hitting the real controller, real
   `DefaultNoteService`, real repository, and Flyway-created schema
   through `MockMvc`, with database state checked independently
   through the repository. No such class exists under
   `com.smartjobtracker.notes`. Every existing note test replaces at
   least one layer with a fake, a hand-built service, or standalone
   `MockMvc` with its own Jackson configuration, so nothing proves the
   layers are actually connected in the running application.
2. **No Postman coverage.** `docs/api/smart-job-tracker.postman_collection.json`
   has `Jobs` and `Tasks` folders with full CRUD flows and error cases,
   but no `Notes` folder, even though task 016 added four note routes.
   `package.json`'s `api:test` and `api:test:local` scripts only
   allowlist `Health`, `Jobs`, and `Tasks`.

## Decisions

### Add `NoteCrudIntegrationTest`, mirroring `TaskCrudIntegrationTest` exactly

Same class shape, same package convention (`com.smartjobtracker.notes`),
same annotations, same repository-verifies-database-state pattern.
Every note route needs a real, persisted job id first, so each test
seeds one through `jobRepository.save(createJobEntity())` before
exercising the note routes.

Rejected: reusing `NoteServiceTest`'s `@SpringBootTest` style instead
of adding MockMvc-based HTTP coverage. `NoteServiceTest` already proves
the service and repository are wired together; what it cannot prove is
that the controller's routing, `@Valid`, JSON deserialization, and
`ApiExceptionHandler` are wired to that same service in the running
application, the same gap task 012's plan identified for tasks.

### Treat the Postman gap as this task's real scope, not a new bug

`tasks/roadmap/017-add-note-crud-endpoints.md`'s Required Changes
section says "Fill gaps left by Tasks 013-016." The backend code has
no such gap; the collection does, and it exists precisely because task
016 (correctly, per its own plan) scoped the collection update out.
Closing it here keeps the same split jobs and tasks used.

Rejected: leaving the collection alone and closing task 017 with only
the integration test. That would leave `AGENTS.md` section 3's "update
the request collection in the same change" rule permanently
unsatisfied for notes.

Rejected: filing a bug instead. `tasks/bugs/README.md` reserves bug
files for defects found while doing something else; this was found by
task 017 itself, whose own required changes line names exactly this
kind of gap.

### No `getNote` route, no service or entity change

Task 015's plan and task 016's plan both already decided against a
single-note GET, since nothing reads one note in isolation. Task 017's
scope list does not mention a get-by-id route either.

### Notes folder is self-contained, mirroring the Tasks folder's pattern

The `Notes` folder opens with its own `Create job for notes` request,
storing the result in a new `noteJobId` variable that only note
requests read, exactly as the `Tasks` folder does with `taskJobId`.
This keeps `Notes` runnable on its own without depending on `Jobs` or
`Tasks` having run first.

### Cover the same error classes Tasks covers, scoped to what notes can actually return

Notes has no single-resource GET, so there is no not-found-by-id case
outside of update/delete. What `NoteService` actually throws is
`JOB_NOT_FOUND` (job missing) and `NOTE_NOT_FOUND` (note missing or
belongs to a different job), verified by reading `DefaultNoteService`.
The `Notes` folder therefore adds:

- `Create note with blank body returns 400` (`VALIDATION_FAILED`),
  mirroring `Create task with blank title returns 400`.
- `Create note for missing job returns 404` (`JOB_NOT_FOUND`).
- `Delete note returns 204` followed by `Delete deleted note returns
  404` (`NOTE_NOT_FOUND`), mirroring the Tasks folder's delete-twice
  shape.

Rejected: a malformed-id (400 `INVALID_REQUEST_PARAMETER`) case, for
the same reason task 012 rejected it for tasks: `NoteControllerTest`
already covers it at the unit level, and Postman requests deliberately
do not restate what the generated OpenAPI import already demonstrates
for every path parameter.

### Add `Notes` to the `api:test`/`api:test:local` allowlist

`Notes` calls no external provider (unlike `AI`), so it belongs in the
automated allowlist the same way `Jobs` and `Tasks` do.

## Proposed Change

### `NoteCrudIntegrationTest`

`backend/src/test/kotlin/com/smartjobtracker/notes/NoteCrudIntegrationTest.kt`,
following `TaskCrudIntegrationTest`'s structure: `@SpringBootTest`,
`@AutoConfigureMockMvc`, `@Transactional`, `MockMvc`, `NoteRepository`,
`JobRepository`, and `ObjectMapper` autowired. A private `seedJob()`
helper and a private `postNote(jobId, body)` helper mirroring
`postTask`.

### `docs/api/smart-job-tracker.postman_collection.json`

- Add `noteJobId` and `noteId` to the collection-level `variable`
  array, alongside the existing `jobId`, `taskJobId`, and `taskId`.
- Add a `Notes` folder between `Tasks` and `AI`, containing, in run
  order:
  1. `Create job for notes` - `POST /jobs`, stores `noteJobId`.
  2. `Create note` - `POST /jobs/{{noteJobId}}/notes`, `Origin` header,
     stores `noteId`, asserts `201`, echoed `body`, and no `jobId` in
     the response body.
  3. `List notes` - `GET /jobs/{{noteJobId}}/notes`, asserts the
     created note's id is present.
  4. `Update note` - `PUT /jobs/{{noteJobId}}/notes/{{noteId}}`,
     `Origin` header, asserts the new `body` and
     `updatedAt >= createdAt`.
  5. `Delete note` - `DELETE /jobs/{{noteJobId}}/notes/{{noteId}}`,
     `Origin` header, asserts `204` and an empty body.
  6. `Delete deleted note returns 404` - same request again, asserts
     `404` / `NOTE_NOT_FOUND`.
  7. `Create note with blank body returns 400` - asserts `400` /
     `VALIDATION_FAILED` naming `body`.
  8. `Create note for missing job returns 404` - `POST
     /jobs/{{$guid}}/notes`, asserts `404` / `JOB_NOT_FOUND`.
- Every write request sends the `Origin: {{appOrigin}}` header and
  asserts no `Access-Control-Allow-Origin` and no `403`, matching the
  Jobs and Tasks folders' CORS-boundary checks.
- Update the collection `info.description` line to mention `Notes` as
  well as `Tasks`.

### `package.json`

Add `--folder Notes` to both `api:test` and `api:test:local`, next to
the existing `--folder Tasks`.

## Tests

### `NoteCrudIntegrationTest`

- creates a note over HTTP under a seeded job and stores it in the
  database
- reads the created note back through `GET /jobs/{jobId}/notes` (there
  is no single-note GET)
- lists notes in creation order for a seeded job, seeded out of
  creation order to prove the ordering is real
- updates a note over HTTP, preserves `createdAt`, refreshes
  `updatedAt`, verified against the database afterward
- deletes a note over HTTP and removes it from the database
- returns `404 JOB_NOT_FOUND` for create, update, and delete against an
  unknown job id
- returns `404 NOTE_NOT_FOUND` for update and delete against an
  unknown note id under a real job
- returns `400 VALIDATION_FAILED` for a blank body through the real
  error handler
- response body omits `jobId` and serializes `createdAt`/`updatedAt`
  as ISO instants

Do not duplicate the validation matrix `NoteControllerTest` already
covers. One representative validation failure through the real stack
is enough to prove `ApiExceptionHandler` is registered for this
controller too.

## Implementation Order

1. Add this plan (already linked from `docs/business/README.md`).
2. Add `NoteCrudIntegrationTest` with the create-and-list round trip.
3. Extend it to update, delete, the missing-job/note cases, the
   validation case, and the response-shape assertions.
4. Run `npm run backend:test`, then `npm run backend:verify`.
5. Add the `Notes` folder to the Postman collection and its two new
   collection variables; update the `info.description` line.
6. Add `--folder Notes` to `api:test` and `api:test:local` in
   `package.json`.
7. After verification passes, apply the completion rules.

## Verification Plan

Run, in order:

```bash
npm run backend:test
```

```bash
npm run backend:verify
```

No entity, repository, or migration change is made in this task, so
`npm run backend:test:integration` is not required, but running it
costs little and confirms nothing in the existing note persistence
path regressed.

The Postman/Newman run (`npm run api:test:local` against
`npm run dev:backend`, per `docs/api/README.md`) is the way to confirm
the collection changes actually execute; it is not part of
`npm run verify` and is exercised manually here rather than requiring a
rebuilt cluster image.

## Scope Boundaries

- No `getNote` route.
- No change to `NoteService`, `DefaultNoteService`, `NoteController`,
  `JobController`, or `TaskController`.
- No database migration or schema change.
- No authentication or user ownership rules.
- No AI answer-to-note behavior.
- No frontend changes.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 017's acceptance criteria.
- Tick task 017 in `docs/backlog/phase-3-backend-foundation.md` and
  point the recommended next task at task 018.
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [x] Note CRUD works through HTTP, proven by a full-stack integration
      test.
- [x] Response contracts are typed and stable.
- [x] The Postman collection has a self-contained `Notes` folder, and
      `api:test`/`api:test:local` run it.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the `feat/task-017-add-note-crud-endpoints`
branch.

- `NoteCrudIntegrationTest` adds 8 cases against the real controller,
  service, repository, and Flyway schema through `MockMvc`: create and
  persist, list in creation order, update preserving `createdAt` and
  refreshing `updatedAt`, delete and remove from the database,
  job-not-found across create/update/delete, note-not-found across
  update/delete, one representative validation failure through the real
  error handler, and a response-shape check confirming `jobId` is
  absent and timestamps serialize as ISO instants.
- The Postman collection gained a `Notes` folder (mirroring `Tasks`
  exactly) with its own `noteJobId`/`noteId` collection variables, an
  8-request CRUD-plus-error flow, and CORS-boundary assertions on every
  write request. `info.description` now mentions the `Notes` folder.
- `package.json`'s `api:test` and `api:test:local` scripts now include
  `--folder Notes`.
- `npm run backend:verify` passed: ktlint, detekt, all tests, and 100%
  JaCoCo line and branch coverage.
- The live Newman run against a started stack was not executed as part
  of this change; the JSON was validated for well-formedness
  (`node -e "JSON.parse(...)"`) and the request/test-script bodies were
  written by direct adaptation of the already-passing `Tasks` folder.
  Run `npm run api:test:local` against `npm run dev:backend` (or
  `npm run api:test` against a rebuilt cluster/compose stack) to
  confirm the live flow before relying on it in CI.
