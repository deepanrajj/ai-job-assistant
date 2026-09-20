# Task 012 - Add Task CRUD Endpoints Plan

Status: Completed

## Purpose

Task 012's file frames it as closing CRUD gaps left by tasks 008-011:
list, create, update, delete, and their error paths. Before writing
any code, audit what tasks 008-011 actually shipped against that list
and add only what is genuinely missing. This is the task pair task
006/007 used for jobs, repeated for tasks: task 011 shipped the
routes, task 012 proves they are wired together end to end and that
the surface a client actually calls (HTTP, not just Postman) is
covered.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/012-add-task-crud-endpoints.md`
- `docs/business/011-create-task-controller-plan.md`
- `docs/business/007-add-job-crud-endpoints-plan.md`
- `docs/api/README.md`

## Current State

Read `TaskController`, `DefaultTaskService`, `TaskControllerTest`,
`TaskServiceTest`, `TaskRepositoryTest`, `TaskPersistenceTest`, and
`TaskRequestMappingTest` end to end before writing this plan. All
four routes task 012 lists already exist and are already tested at
every layer:

- `GET /jobs/{jobId}/tasks` - list, including the missing-job 404.
- `POST /jobs/{jobId}/tasks` - create, including blank/overlong title,
  unknown status value, and missing-job 404.
- `PUT /jobs/{jobId}/tasks/{taskId}` - update, including clearing
  `dueDate` with an explicit `null`, missing status, missing-job 404,
  missing-task 404, and the cross-job case (updating a real task id
  under the wrong job returns `TASK_NOT_FOUND` and leaves the row
  untouched).
- `DELETE /jobs/{jobId}/tasks/{taskId}` - delete, including
  missing-job 404, missing-task 404, and the same cross-job case.

`npm run backend:verify` passes clean on `main` with 100 percent
JaCoCo line and branch coverage before this task changes anything,
confirmed by running it. Every layer already has an isolated test:
controller (`TaskControllerTest`, standalone `MockMvc` + fake
service), service (`TaskServiceTest`, real repository via
`@SpringBootTest`), repository (`TaskRepositoryTest`), persistence
(`TaskPersistenceTest`), and mapping (`TaskRequestMappingTest`).

Two real gaps remain, both found by comparing tasks 008-011 against
what tasks 003-007 shipped for jobs before task 007 closed the same
kind of gap:

1. **No full-stack integration test.** `JobCrudIntegrationTest`
   (task 007) is the pattern: `@SpringBootTest` +
   `@AutoConfigureMockMvc` + `@Transactional`, hitting the real
   controller, real `DefaultTaskService`, real repository, and
   Flyway-created schema through `MockMvc`, with database state
   checked independently through the repository. No such class
   exists under `com.smartjobtracker.tasks`. Every existing task test
   replaces at least one layer with a fake, a hand-built service, or
   standalone `MockMvc` with its own Jackson configuration, so
   nothing proves the layers are actually connected in the running
   application, or how the application's real Jackson configuration
   serializes a `TaskResponse`.
2. **No Postman coverage.** `docs/api/README.md`'s "Keeping it
   honest" section and `AGENTS.md` section 3 (Phase 4 of
   `start-task`) require the request collection to be updated in the
   same change that adds or changes an HTTP endpoint.
   `docs/api/smart-job-tracker.postman_collection.json` has a `Jobs`
   folder with a full create-read-update-delete flow and error cases,
   but no `Tasks` folder at all, even though task 011 added four task
   routes. `package.json`'s `api:test` and `api:test:local` scripts
   only allowlist `Health` and `Jobs`.

## Decisions

### Add `TaskCrudIntegrationTest`, mirroring `JobCrudIntegrationTest` exactly

Same class shape, same package convention
(`com.smartjobtracker.tasks`), same annotations, same
repository-verifies-database-state pattern. Nesting under a job adds
one wrinkle jobs did not have: every task route needs a real,
persisted job id first, so each test seeds one through
`jobRepository.save(createJobEntity())` before exercising the task
routes.

Rejected: reusing `TaskServiceTest`'s `@SpringBootTest` style instead
of adding MockMvc-based HTTP coverage. `TaskServiceTest` already
proves the service and repository are wired together; what it cannot
prove is that the controller's routing, `@Valid`, JSON
deserialization, and `ApiExceptionHandler` are wired to that same
service in the running application. That is specifically what task
007's plan identified as the gap for jobs, and it applies identically
here.

### Treat the Postman gap as this task's real scope, not a new bug

`tasks/roadmap/012-add-task-crud-endpoints.md`'s Required Changes
section says "Fill gaps left by Tasks 008-011." The backend code has
no such gap; the collection does, and it exists precisely because
task 011 (correctly, per its own plan) scoped the collection update
out. Closing it here keeps the same split jobs used across tasks
006/007: the controller task ships the routes, the follow-up task
verifies the CRUD surface end to end - and for jobs, "end to end"
included the Postman flow.

Rejected: leaving the collection alone and closing task 012 as a
no-op. That would leave `AGENTS.md` section 3's "update the request
collection in the same change" rule permanently unsatisfied for
tasks, since no future task file is going to reopen this scope on its
own.

Rejected: filing a bug instead. `tasks/bugs/README.md` reserves bug
files for defects found "in the change that found it" while doing
something else; this was found by task 012 itself, whose own required
changes line names exactly this kind of gap.

### No `getTask` route, no service or entity change

Task 010's plan and task 011's plan both already decided against a
single-task GET, since nothing reads one task in isolation and the
frontend always reaches a task through its job. Task 012's scope list
does not mention a get-by-id route either. Adding one now would be
inferring extra scope from a resource-parity instinct ("jobs has
one"), which `AGENTS.md` section 2 rules out.

### Tasks folder is self-contained, not dependent on the Jobs folder's run order

The `Jobs` folder's `Create job` request sets the collection variable
`jobId`, which every later Jobs request reads. Tasks could reuse that
variable and depend on `Jobs` running first, but that would make
`Tasks` unrunnable on its own and couple two folders that the
collection runner does not guarantee an order between. Instead the
`Tasks` folder opens with its own `Create job for tasks` request,
storing the result in a new `taskJobId` variable that only task
requests read. This mirrors `Jobs`'s pattern (one request seeds an id,
everything after it reads that id) without depending on it.

### Cover the same error classes Jobs covers, scoped to what tasks can actually return

Tasks has no single-resource GET, so there is no `Get deleted task
returns 404` equivalent for a plain 404-by-id. What `TaskService`
actually throws is `JOB_NOT_FOUND` (job missing) and `TASK_NOT_FOUND`
(task missing or belongs to a different job), verified by reading
`DefaultTaskService`. The `Tasks` folder therefore adds:

- `Create task with blank title returns 400` (`VALIDATION_FAILED`),
  mirroring `Create job with blank company returns 400`.
- `Create task for missing job returns 404` (`JOB_NOT_FOUND`), the
  task equivalent of a not-found path, since there is no GET to reuse
  for it.
- `Delete task returns 204` followed by `Delete deleted task returns
  404` (`TASK_NOT_FOUND`), mirroring `Delete job` followed by `Get
  deleted job returns 404`, adapted to the delete-twice shape since
  there is no GET to prove the row is gone.

Rejected: a malformed-id (400 `INVALID_REQUEST_PARAMETER`) case.
`JobControllerTest`'s equivalent exists because `docs/api/README.md`
calls out bug 002 by name; there is no comparable history for tasks,
`TaskControllerTest` already covers it at the unit level, and Postman
requests deliberately do not restate what the generated OpenAPI
import already demonstrates for every path parameter.

### Add `Tasks` to the `api:test`/`api:test:local` allowlist

`docs/api/README.md` says a folder added to the collection "does not
start running on its own; somebody has to add it to the script on
purpose." `Tasks` calls no external provider (unlike `AI`), so it
belongs in the automated allowlist the same way `Jobs` does.

## Proposed Change

### `TaskCrudIntegrationTest`

`backend/src/test/kotlin/com/smartjobtracker/tasks/TaskCrudIntegrationTest.kt`,
following `JobCrudIntegrationTest`'s structure: `@SpringBootTest`,
`@AutoConfigureMockMvc`, `@Transactional`, `MockMvc`, `TaskRepository`,
`JobRepository`, and `ObjectMapper` autowired. A private `seedJob()`
helper (`jobRepository.save(createJobEntity()).id`) and a private
`postTask(jobId, body)` helper mirroring `postJob`.

### `docs/api/smart-job-tracker.postman_collection.json`

- Add `taskJobId` and `taskId` to the collection-level `variable`
  array, alongside the existing `jobId`.
- Add a `Tasks` folder between `Jobs` and `AI`, containing, in run
  order:
  1. `Create job for tasks` - `POST /jobs`, stores `taskJobId`.
  2. `Create task` - `POST /jobs/{{taskJobId}}/tasks`, `Origin`
     header, stores `taskId`, asserts `201`, echoed `title`, default
     `status` `TODO`, and no `jobId` in the body.
  3. `List tasks` - `GET /jobs/{{taskJobId}}/tasks`, asserts the
     created task's id is present.
  4. `Update task` - `PUT /jobs/{{taskJobId}}/tasks/{{taskId}}`,
     `Origin` header, body clears `dueDate` with an explicit `null`,
     asserts the new `title`/`status`, `dueDate` cleared, and
     `updatedAt >= createdAt`.
  5. `Delete task` - `DELETE
     /jobs/{{taskJobId}}/tasks/{{taskId}}`, `Origin` header, asserts
     `204` and an empty body.
  6. `Delete deleted task returns 404` - same request again, asserts
     `404` / `TASK_NOT_FOUND`.
  7. `Create task with blank title returns 400` - asserts `400` /
     `VALIDATION_FAILED` naming `title`.
  8. `Create task for missing job returns 404` - `POST
     /jobs/{{$guid}}/tasks`, asserts `404` / `JOB_NOT_FOUND`.
- Every write request (`Create job for tasks`, `Create task`, `Update
  task`, `Delete task`) sends the `Origin: {{appOrigin}}` header and
  asserts no `Access-Control-Allow-Origin` and no `403`, matching the
  Jobs folder's CORS-boundary checks - the same defect class
  `docs/engineering/same-origin-api-boundary.md` describes is just as
  possible for a nested route.
- Update the collection `info.description` line that currently says
  "Run the 'Jobs' folder ..." to mention `Tasks` as well.

### `package.json`

Add `--folder Tasks` to both `api:test` and `api:test:local`, next to
the existing `--folder Jobs`.

## Tests

### `TaskCrudIntegrationTest`

- creates a task over HTTP under a seeded job and stores it in the
  database, defaulting `status` to `TODO`
- reads the created task back through `GET /jobs/{jobId}/tasks`
  (there is no single-task GET, so "read back" means it appears in
  the list)
- lists tasks in creation order for a seeded job, seeded out of
  creation order to prove the ordering is real
- updates a task over HTTP, preserves `createdAt`, refreshes
  `updatedAt`, and clears `dueDate` when sent explicit `null`,
  verified against the database afterward
- deletes a task over HTTP and removes it from the database
- returns `404 JOB_NOT_FOUND` for create, update, and delete against
  an unknown job id
- returns `404 TASK_NOT_FOUND` for update and delete against an
  unknown task id under a real job
- returns `400 VALIDATION_FAILED` for a blank title through the real
  error handler
- response body omits `jobId` and serializes `createdAt`/`updatedAt`
  as ISO instants

Do not duplicate the validation matrix `TaskControllerTest` already
covers. One representative validation failure through the real stack
is enough to prove `ApiExceptionHandler` is registered for this
controller too.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Add `TaskCrudIntegrationTest` with the create-and-list round trip.
3. Extend it to update, delete, the missing-job/task cases, the
   validation case, and the response-shape assertions.
4. Run `npm run backend:test`, then `npm run backend:verify`.
5. Edit the Postman collection: variables, then the `Tasks` folder
   items in the order listed above, then the `info.description` line.
6. Add `--folder Tasks` to both npm scripts in `package.json`.
7. Bring up a stack that serves the working tree (`npm run
   dev:compose`) and run `npm run api:test` against it.
8. After verification passes, apply the completion rules.

## Verification Plan

```bash
npm run backend:test
```

```bash
npm run backend:verify
```

```bash
npm run dev:compose
npm run api:test
```

All existing job, task, and AI tests must keep passing, and the 100
percent JaCoCo gate must hold. Running the Newman flow against a
freshly built stack is the check that actually exercises the Postman
change - `AGENTS.md`'s table names `docs/api/*.json` changes as
requiring `npm run api:test` against a rebuilt stack.

## Scope Boundaries

- No frontend integration.
- No new backend route, DTO, service, or entity change.
- No `getTask` route.
- No note or timeline routes.
- No authentication or user ownership rules.
- No change to the `AI` folder or its allowlist exclusion.
- No unrelated formatting or refactors to the collection's existing
  `Jobs`/`Health`/`AI` folders beyond the `info.description` line.

## Completion Rules

After implementation and verification pass:

- Tick task 012's acceptance criteria.
- Tick task 012 in `docs/backlog/phase-3-backend-foundation.md` and
  point the recommended next task at task 013.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md`'s Current API section already lists the task
  routes from task 011; no change needed there since no route
  changed.

## Acceptance Criteria

- [ ] Task CRUD works through HTTP, proven by an automated test
      against the real application context and reconfirmed by the
      Newman run this task adds.
- [ ] Response contracts are typed and stable, including timestamp
      format and the absence of `jobId`.
- [ ] Backend verification passes.
- [x] The Postman collection has a `Tasks` folder covering the full
      CRUD flow and its error paths, wired into `api:test` and
      `api:test:local`.

## Verified State

Implemented and verified on the `feat/task-012-add-task-crud-endpoints`
branch.

- `TaskCrudIntegrationTest` boots the application with
  `@SpringBootTest` and `@AutoConfigureMockMvc` and covers create,
  list ordering, update (including clearing `dueDate`), delete, the
  job-not-found and task-not-found cases for create/update/delete, one
  validation failure, and the response shape (`jobId` absent,
  timestamps as ISO instants). Nine tests, mirroring
  `JobCrudIntegrationTest`'s structure with a seeded job per test since
  every task route is nested under one. The ordering test seeds tasks
  directly through `taskRepository.save` with explicit out-of-order
  `createdAt` values (matching `TaskRepositoryTest`'s pattern) rather
  than creating them through HTTP in list order, so it actually
  exercises the `ORDER BY` clause instead of coincidentally matching
  insertion order - a code-review finding caught the first version
  doing the weaker thing.
- The Postman collection gained a `Tasks` folder between `Jobs` and
  `AI`: `Create job for tasks`, `Create task`, `List tasks`, `Update
  task`, `Delete task`, `Delete deleted task returns 404`, `Create
  task with blank title returns 400`, and `Create task for missing
  job returns 404`. It seeds its own job through a new `taskJobId`
  variable rather than depending on the `Jobs` folder's `jobId`, so it
  runs standalone. Every write request carries the same `Origin`
  header and CORS-boundary assertions the `Jobs` folder uses.
  `taskJobId` and `taskId` were added to the collection's variable
  array, and `--folder Tasks` was added to both `api:test` and
  `api:test:local` in `package.json`.
- `npm run backend:test`, `npm run backend:verify` (ktlint, detekt,
  all tests, 100 percent JaCoCo line and branch coverage), and `npm
  run api:test` against a stack rebuilt with `npm run dev:compose`
  all passed: 17 requests, 51 assertions, 0 failures across `Health`,
  `Jobs`, and `Tasks`.
