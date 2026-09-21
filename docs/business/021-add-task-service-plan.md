# Task 021 - Add Frontend Task Service Plan

Status: Completed

## Purpose

Add a typed frontend service for the backend job-task endpoints: list,
create, update, delete, nested under a job. Nothing consumes it yet;
task 030 connects the tasks tab to it.

Task 020 already did the hard discovery work for this pattern: it
compared `TJob` against `JobResponse` from a running backend and found
a real mismatch (`tags`/`nextStep` sent by the frontend model but
absent from the wire). This task reuses that established shape
(`*.types.ts`/`*.service.ts`/`*.utils.ts`/barrel, wire-typed response,
one error code, translated fallback messages) rather than
re-discovering it, and checks whether the same kind of mismatch exists
for tasks.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/021-add-task-service.md`
- `docs/business/020-add-job-service-plan.md` (the pattern this follows)
- `docs/business/011-create-task-controller-plan.md` (the backend
  contract this types against)

## Current State

- `TaskResponse` (backend, `tasks/dto/TaskResponse.kt`): `id`, `title`,
  `status`, `dueDate`, `createdAt`, `updatedAt`. No `jobId` - every
  route already carries it in the path.
- `CreateTaskRequest`: `title` (required), `status` (optional, defaults
  to `TODO` in the command, not the DTO), `dueDate` (optional).
- `UpdateTaskRequest`: `title`, `status` (both required), `dueDate`
  (required key, nullable value - an explicit `null` clears it).
- Routes: `GET/POST /api/jobs/{jobId}/tasks`,
  `PUT/DELETE /api/jobs/{jobId}/tasks/{taskId}`. No single-task GET.
- Frontend already has `TJobTask` (`types/job/jobDetail.types.ts`):
  `{ id, title, dueDate: string, status: 'TODO' | 'DONE' }`. This is a
  mock-era UI model, not the wire contract - notably `dueDate` is
  required there, but the backend column is nullable.
- `src/services/jobs/` is the pattern to follow exactly, established by
  task 020: `jobs.types.ts`, `jobs.service.ts`, `jobs.utils.ts`,
  `jobs.service.test.ts`, `index.ts`.

## Decisions

### Checked the contract against `TaskControllerTest`/`TaskCrudIntegrationTest` rather than re-probing a live backend

Task 020 needed a live-stack probe because nothing had ever compared
the two halves before. That comparison now exists and is exercised on
every `backend:verify` run: `TaskControllerTest` asserts the exact
response shape (no `jobId`, `status` defaults to `TODO`, due date
clears on explicit `null`), and `TaskCrudIntegrationTest` proves it
through the real stack. Reading those tests is equivalent to the probe
task 020 ran, without re-running one for a contract that already has
automated coverage. No mismatch was found: unlike task 020's `TJob`,
nothing in this task invents a UI-shaped request field the backend
does not accept.

### The service is typed to the wire (`TTaskResponse`), not to `TJobTask`

Same reasoning as `TJobResponse` in task 020: `dueDate: string | null`,
matching the nullable backend column exactly, not `TJobTask`'s
required `dueDate: string`. Mapping the wire type to `TJobTask` (if
still needed once task 030 exists) is that task's problem, the same
way task 023 owns the job mapping.

`status` reuses the existing `TJobTaskStatus` (`'TODO' | 'DONE'`) from
`types/job/jobDetail.types.ts` rather than declaring a new task-service
enum: the value set already matches the backend's `TaskStatus`, and
duplicating it would just be two names for one type.

### Every task function is job-scoped, taking `jobId` first

```ts
getTasks(jobId: string): Promise<TTaskResponse[]>
createTask(jobId: string, payload: TCreateTaskRequest): Promise<TTaskResponse>
updateTask(jobId: string, taskId: string, payload: TUpdateTaskRequest): Promise<TTaskResponse>
deleteTask(jobId: string, taskId: string): Promise<void>
```

Mirrors the backend's own route nesting and parameter order
(`TaskController` takes `jobId` before `taskId` on every route). No
`getTaskById`: the backend has no such route, matching task 011's
decision that nothing reads one task in isolation.

### Both `jobId` and `taskId` are encoded

Task 020's own review found an unencoded id lets `getJobById('../ai/health')`
escape the jobs path and hit a different endpoint. `getTasksEndpoint`
and `getTaskEndpoint` apply `encodeURIComponent` to both segments from
the start, rather than waiting to find the same defect again.

### One `TASK_REQUEST_FAILED` error code, four fallback keys

Same reasoning task 020 gave for `JOB_REQUEST_FAILED`: nothing branches
on a more specific code yet, and one code with four translated
fallback messages (`listTasks`, `createTask`, `updateTask`,
`deleteTask`) avoids untested branches under the 100 percent coverage
gate. No `getTaskById` fallback key, since there is no such function.

## Proposed Change

New files under `src/services/tasks/`, mirroring `src/services/jobs/`:

| File | Holds |
| --- | --- |
| `tasks.types.ts` | `TTaskResponse`, `TCreateTaskRequest`, `TUpdateTaskRequest`, the fallback key map |
| `tasks.service.ts` | `getTasks`, `createTask`, `updateTask`, `deleteTask` |
| `tasks.utils.ts` | `getTaskFallbackErrorMessage` |
| `tasks.service.test.ts` | success, error mapping, request body shape, id encoding |
| `index.ts` | barrel |

Edited files:

- `src/services/index.ts` - export the new barrel.
- `src/types/error/error.types.ts` - add `TASK_REQUEST_FAILED`.
- `src/i18n/locales/en.json` and `de.json` - four fallback messages
  under a new `tasks.fallbackError` key.

## Tests

`tasks.service.test.ts`, following `jobs.service.test.ts`: mocks `../api`,
not `fetch`.

Per operation: the right client function, URL, and error mapping; the
request body for create and update; the value that comes back.

Two cases specific to tasks, beyond what jobs needed:

- **Both `jobId` and `taskId` are encoded**, not just one id like jobs.
  Asserted on `updateTask`/`deleteTask` with both segments containing
  path-traversal characters.
- **The due-date-clearing update sends an explicit `null`**, mirroring
  the backend's `UpdateTaskCommand` treating `null` as "clear it."

`deleteTask` returns the client's result unchanged, the same limited
claim task 020 corrected its own test to make: whether a 204 really
produces `undefined` is `parseJsonResponse`'s behavior, tested there.

## Implementation Order

1. `error.types.ts` and both locale files.
2. `tasks.types.ts`.
3. `tasks.service.ts`.
4. `tasks.service.test.ts`.
5. Barrel and `services/index.ts`.

## Verification Plan

```bash
npm run frontend:test:coverage
```

```bash
npm run frontend:verify
```

`npm run verify` is not required; nothing under `backend/` changes.

## Scope Boundaries

- No mapping `TTaskResponse` to `TJobTask`. That is task 030's concern,
  if still needed once the tasks tab is wired up.
- No page, provider, or job-detail tasks-tab change. Task 030.
- No `getTaskById`. The backend has no such route.
- No data-fetching library.

## Completion Rules

- `npm run frontend:verify` passes.
- Task file criteria ticked, status set.
- `docs/backlog/phase-4-frontend-backend-integration.md` updated.
- `docs/business/README.md` links this plan.

## Acceptance Criteria

- [x] Task service functions are typed.
- [x] Tests cover success and error paths.
- [x] No UI behavior changes yet.

## Verified State

Five files added under `frontend/src/services/tasks/`, one error code,
one barrel export, and four translation keys in each locale. Nothing
imports the new service yet, so the third acceptance criterion holds
literally, the same way task 020 recorded it.

`npm run frontend:test:coverage`: 9 new tests pass, 317 total, all
existing suites unaffected. Per-file coverage for the three new source
files is 100 percent statements/branches/functions/lines; the
repository-wide numbers (99.6 percent statements, 98.91 percent
branches) are unchanged pre-existing shortfalls elsewhere, confirmed
from the per-file report rather than inferred from the totals.

`npm run frontend:verify` passed: lint, format check, coverage, build.

No mismatch equivalent to task 020's `tags`/`nextStep` finding was
found for tasks: `TCreateTaskRequest`/`TUpdateTaskRequest` send exactly
the fields `CreateTaskRequest`/`UpdateTaskRequest` accept, checked
against `TaskControllerTest` and `TaskCrudIntegrationTest` rather than
a live-stack probe, per the Decisions section above.
