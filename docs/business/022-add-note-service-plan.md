# Task 022 - Add Frontend Note Service Plan

Status: Completed

## Purpose

Add a typed frontend service for the backend job-note endpoints: list,
create, update, delete, nested under a job. Nothing consumes it yet;
task 031 connects the notes tab to it.

Follows the same pattern task 020 established for jobs and task 021
applied to tasks. Notes are the simplest of the three domains - one
editable field, `body` - so this task is mostly transcription with one
contract check, not new design.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/022-add-note-service.md`
- `docs/business/020-add-job-service-plan.md` (the pattern)
- `docs/business/021-add-task-service-plan.md` (the same pattern
  applied to a second nested domain)
- `docs/business/016-create-note-controller-plan.md` (the backend
  contract this types against)

## Current State

- `NoteResponse` (backend, `notes/dto/NoteResponse.kt`): `id`, `body`,
  `createdAt`, `updatedAt`. No `jobId`, matching `TaskResponse`'s own
  precedent.
- `CreateNoteRequest`/`UpdateNoteRequest`: both just `{ body: String }`,
  `@NotBlank`. No optional fields, no enum, no nullable column - notes
  have no status and no scheduling field.
- Routes: `GET/POST /api/jobs/{jobId}/notes`,
  `PUT/DELETE /api/jobs/{jobId}/notes/{noteId}`. No single-note GET.
- `src/services/tasks/` (task 021) is the more relevant precedent than
  `src/services/jobs/` here, since notes are also job-nested with no
  single-resource GET; the only difference is one field instead of
  three.

## Decisions

### Checked the contract against `NoteControllerTest`/`NoteCrudIntegrationTest`, not a live probe

Same reasoning as task 021: those tests already exist and run on every
`backend:verify`, so reading them is equivalent to task 020's original
live-stack probe for a contract that already has automated coverage.
No mismatch found: `TCreateNoteRequest`/`TUpdateNoteRequest` send
exactly the one field the backend accepts.

### The service is typed to the wire (`TNoteResponse`), not to `TJobNote`

`TJobNote` (`types/job/jobDetail.types.ts`) already happens to match
the wire shape (`{ id, body, createdAt }`) reasonably closely, but it
has no `updatedAt` and predates any real contract check. `TNoteResponse`
is declared fresh rather than reused, for the same reason task 020
rejected returning `TJob` directly: a service typed to a UI model
either has to invent fields the wire does not send or the two types
quietly drift once one of them changes for a reason the other does not
share.

### Both `jobId` and `noteId` are encoded, from the start

Same defect class task 020 found and task 021 pre-empted:
`encodeURIComponent` on both path segments from the first version,
rather than waiting to rediscover the same escape.

### One `NOTE_REQUEST_FAILED` error code, four fallback keys

Same reasoning as `JOB_REQUEST_FAILED`/`TASK_REQUEST_FAILED`: nothing
branches on a more specific code yet. No `getNoteById` key, since there
is no such function.

## Proposed Change

New files under `src/services/notes/`, mirroring `src/services/tasks/`:

| File | Holds |
| --- | --- |
| `notes.types.ts` | `TNoteResponse`, `TCreateNoteRequest`, `TUpdateNoteRequest`, the fallback key map |
| `notes.service.ts` | `getNotes`, `createNote`, `updateNote`, `deleteNote` |
| `notes.utils.ts` | `getNoteFallbackErrorMessage` |
| `notes.service.test.ts` | success, error mapping, request body shape, id encoding |
| `index.ts` | barrel |

Edited files:

- `src/services/index.ts` - export the new barrel.
- `src/types/error/error.types.ts` - add `NOTE_REQUEST_FAILED`.
- `src/i18n/locales/en.json` and `de.json` - four fallback messages
  under a new `notes.fallbackError` key.

## Tests

`notes.service.test.ts`, following `tasks.service.test.ts`: mocks
`../api`, asserts the right client function/URL/error mapping per
operation, the request body for create and update, and that both
`jobId` and `noteId` are encoded on a note route.

`deleteNote` returns the client's result unchanged only - the 204
handling itself is `parseJsonResponse`'s behavior, tested there.

## Implementation Order

1. `error.types.ts` and both locale files.
2. `notes.types.ts`.
3. `notes.service.ts`.
4. `notes.service.test.ts`.
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

- No mapping `TNoteResponse` to `TJobNote`. Task 031's concern, if
  still needed once the notes tab is wired up.
- No page, provider, or job-detail notes-tab change. Task 031.
- No `getNoteById`. The backend has no such route.
- No saving AI answers as notes. Out of scope per the task file.
- No data-fetching library.

## Completion Rules

- `npm run frontend:verify` passes.
- Task file criteria ticked, status set.
- `docs/backlog/phase-4-frontend-backend-integration.md` updated.
- `docs/business/README.md` links this plan.

## Acceptance Criteria

- [x] Note service functions are typed.
- [x] Tests cover success and error paths.
- [x] No UI behavior changes yet.

## Verified State

Five files added under `frontend/src/services/notes/`, one error code,
one barrel export, and four translation keys in each locale. Nothing
imports the new service yet.

`npm run frontend:test:coverage`: 7 new tests pass, 317 total (same
total as task 021's branch, since these are independent branches off
`main`), all existing suites unaffected. Per-file coverage for the
three new source files is 100 percent statements/branches/functions/
lines; repository-wide numbers unchanged from pre-existing shortfalls
elsewhere.

`npm run frontend:verify` passed: lint, format check, coverage, build.

No mismatch was found between `TCreateNoteRequest`/`TUpdateNoteRequest`
and what `CreateNoteRequest`/`UpdateNoteRequest` accept, checked
against `NoteControllerTest`/`NoteCrudIntegrationTest`.
