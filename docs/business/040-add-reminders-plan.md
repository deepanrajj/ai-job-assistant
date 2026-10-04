# Task 040 - Add Reminders Plan

Status: In progress

## Purpose

Let a user attach dated reminders to a saved job - follow up with a
recruiter, prepare for an interview, meet an application deadline, or
finish a task by a date - mark them done, and see what is next on the
dashboard. The task file scopes this to in-app reminders: no push or
email notifications, no external calendar sync, and no recurrence.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| 1-6 | Backend | Step 1 (move validation helpers) started and stashed as `task-040 backend step 1 in progress`: both files moved and `FourDigitYear.kt`'s package updated; `RequestTrimming.kt`'s package, the two KDoc rewordings, and the contact imports remain. Steps 2-6 not started |
| 7 | Postman folder and `api:test` allowlist | Not started |
| 8-10 | Frontend | Done in `f256ea4`; `npm run frontend:verify` passed (582 tests) |
| 11 | Manual browser check | Blocked until the backend endpoints exist |
| 12 | Close-out docs | Not started |
| - | **Remove the temporary mock** | Required before merge, once steps 1-6 land |

### Temporary reminder mock

Added at the user's request so the UI can be seen before the backend
exists. `frontend/src/services/reminders/reminders.mock.ts` fakes the
five reminder endpoints in browser memory: four seeded reminders per job
(overdue, due today, upcoming, completed), full create, edit, complete,
reopen, and delete, and `GET /api/reminders/next` built from the real
jobs and tasks. Jobs and tasks are never mocked, so task reminders and
their completion are real. Mock reminders reset on every page reload.

It is on in the dev server and in built images
(`import.meta.env.MODE !== 'test'`) and off under Vitest, so every
existing test still exercises the real request path (verified: Vitest
reports `MODE` as `test`).

**The branch must not merge with the mock in it.** Removal, as the
file's header also says:

1. Delete `reminders.mock.ts` and `reminders.mock.test.ts`.
2. Delete the `USE_MOCK_REMINDERS` branches and the `./reminders.mock`
   import in `reminders.service.ts`.
3. Run the browser check (step 11) against the real endpoints.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md` (data model: `Reminder` is `id, jobId, type,
  title, dueDate, completedAt, createdAt, updatedAt`; this plan keeps it
  unchanged)
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Reminder Delivery Is A Separate Follow-Up": date-only reminders
  stay calendar dates)
- `tasks/roadmap/040-add-reminders.md`

## Current State

### Audited: contacts are the closest precedent

Task 039's contacts are a per-job collection with create, edit, and
delete, persisted in Postgres and shown in a job detail tab. Reminders
have the same shape, so this plan copies that path. Everything below
was read on `main` at `eb42579`.

| Layer | File | Pattern |
| --- | --- | --- |
| Migration | `V7__create_contacts_table.sql` | `job_id ... REFERENCES jobs (id) ON DELETE CASCADE` plus `idx_contacts_job_id` |
| Entity | `contacts/Contact.kt` | extends `AssignedIdEntity`; editable columns `var`; enum beside the entity, stored by name |
| Repository | `contacts/ContactRepository.kt` | `findAllByJobId...`, `findByIdAndJobId` |
| Service | `contacts/ContactService.kt` | interface + `Default...`; every method first calls `jobService.getJob(jobId)`; update mutates the managed entity |
| Controller | `contacts/ContactController.kt` | `/jobs/{jobId}/contacts`: `GET`, `POST` (201), `PUT`, `DELETE` (204) |
| DTOs | `contacts/dto` | trim deserializers, `FourDigitYear`, field limits and shared messages |
| Cross-job read | `timeline/TimelineEventController.kt` | `GET /timeline-events?page=&size=`, clamped, returns `PagedResponse` |
| Hook | `features/jobDetail/useJobContacts.ts` | load, `useAsyncMutation` writes, stale-reload guard, confirmed writes applied to the cached list |
| Panel | `features/jobDetail/components/JobDetailContactsPanel.tsx` | create form, read rows with Edit and Delete |
| Dashboard | `routes/modules/dashboardRoute.tsx`, `pages/dashboard/DashboardPage.tsx` | route owns the jobs request; page derives cards from jobs |

Two facts that shape the decisions:

- `tasks` already have a nullable `due_date`. A "task due" reminder
  overlaps with it (D3).
- Job detail tabs are local component state, not part of the URL, so
  a dashboard link can open a job but not a specific tab (D9).

## Decisions

### D1 - Persist in a new `reminders` table behind a nested endpoint

Chosen: a `reminders` table with a `job_id` foreign key and `ON DELETE
CASCADE`, exposed at `/jobs/{jobId}/reminders`, matching `docs/context.md`
field for field: `type`, `title`, `dueDate`, `completedAt`, plus the
audit timestamps.

Rejected:

- Reusing `tasks` with a `type` column. Tasks are a to-do checklist
  with an optional date; a reminder is a date first. Merging them
  changes a finished feature and the locked model for both.
- A JSON column on `jobs`, or frontend-only storage. Rejected for the
  same reasons as in the contacts plan (D1 there).

### D2 - `dueDate` is a required `DATE`, not a timestamp

A reminder without a date is a task, so `dueDate` is required. It is a
calendar date (`LocalDate`, `DATE` column), like `tasks.due_date`, and
is guarded by `@FourDigitYear` for the reason recorded on that
annotation (a five-digit year serializes with a sign and breaks the
frontend's date parse).

A past `dueDate` is accepted on create: a user catching up may log a
follow-up that is already late, and it should show as overdue rather
than be refused.

Rejected: a `TIMESTAMP WITH TIME ZONE` due time. Timed interviews need
the timezone model that R-09/R-02 defer, and the product plan says
date-only reminders stay calendar dates, "not invented midnight UTC
appointments".

### D3 - Two kinds of reminder: stored general reminders, derived task reminders

The user wants task-due reminders kept in sync with the task itself,
alongside general reminders they set by hand. The way to guarantee that
is to never copy the task's date anywhere.

Chosen:

- **General reminders** are rows in `reminders`. `ReminderType` is
  `FOLLOW_UP`, `INTERVIEW_PREP`, `APPLICATION_DEADLINE`, and `OTHER`,
  stored as `VARCHAR(50)` by name and required with no default. `OTHER`
  exists for the same reason as `ContactType.OTHER`.
- **Task reminders** are not stored. Every task with a `dueDate` *is*
  a reminder: its title, its date, and done when the task's status is
  `DONE`. They are read from `tasks` at query time, so editing the
  task's date, completing it, or deleting it changes the reminder in
  the same instant, with no sync code to get wrong. A task without a
  `dueDate` is not a reminder.

Consequences:

- There is no `TASK_DUE` enum value; the task Goal's "task due
  reminders" are the derived kind.
- A task reminder is edited and deleted through the task, in the Tasks
  tab. From the Reminders tab and the dashboard it can only be
  completed or reopened, which calls the existing
  `PUT /jobs/{jobId}/tasks/{taskId}` with the task's other fields
  unchanged.
- A completed task has no completion date (`tasks` stores `status`, not
  `completedAt`), so a done task reminder shows no "completed on" date.
  Adding one would change the tasks model and is out of scope.

Rejected:

- A stored `TASK_DUE` reminder with a `taskId` foreign key, updated by
  `TaskService` whenever a task changes. That is two copies of one date
  kept in step by hand: every task write path has to remember it, a
  missed path leaves a stale reminder, and task deletion needs its own
  rule. Deriving it cannot drift.
- A `TASK_DUE` reminder with no link to a task, as first planned. The
  user asked for the two to stay in sync, which an unlinked copy cannot
  do.

### D4 - Completion is `completedAt`, set by the server from a boolean

The locked model stores `completedAt`, not a flag. The API takes
`completed: Boolean` on update, and the service owns the timestamp:

| Stored `completedAt` | Request `completed` | Result |
| --- | --- | --- |
| `null` | `false` | stays `null` |
| `null` | `true` | set to `now(clock)` |
| set | `true` | **kept** - resaving a done reminder does not move its date |
| set | `false` | cleared to `null` (reopened) |

Create has no `completed` field: a new reminder is always open.
The response exposes `completedAt`; the frontend derives "done" from it
being non-null.

Rejected:

- The client sends `completedAt`. It would trust the browser's clock
  and let a client write any date.
- A separate `POST .../complete` endpoint. It adds a route for what is
  one field of a full-replacement `PUT`, which is how tasks toggle
  `status`.
- A `status` enum. It duplicates what `completedAt != null` already
  says, which the contacts plan rejected for the same reason (D5 there).

### D5 - Overdue, due today, and upcoming are computed in the browser

The three states depend on "today", and today depends on where the
user is. The server's clock (UTC in the container) would mark a
reminder overdue hours early or late for a user in Berlin. So the API
returns only dates, and the frontend compares `dueDate` against the
browser-local calendar date:

- `overdue`: open and `dueDate` before today.
- `today`: open and `dueDate` equal to today.
- `upcoming`: open and `dueDate` after today.
- Completed reminders have no due state.

Rejected: a computed `overdue` field on the response. It bakes in the
server's timezone and would go stale on a cached response at midnight.

### D6 - Title only, no notes

`title` is `@NotBlank`, trimmed, at most 255 characters. The locked
model has no notes or description column, and a follow-up's context
already lives in the job's notes and contacts.

Rejected: a `notes` column. It changes the locked model for something
the task file does not ask for.

### D7 - Dashboard reads a new cross-job endpoint, not one request per job

The dashboard needs the next open reminders across every job.

Chosen: `GET /api/reminders/next?limit=`, returning the `limit`
earliest **open** items across both kinds (D3), ordered by `dueDate`
ascending, then `id`. Overdue items come first because their dates are
earliest. `limit` defaults to `5` and is clamped to `[1, 20]`, as the
timeline endpoint clamps `size`.

The service runs two bounded queries, each taking at most `limit`
rows: open reminders (`completed_at IS NULL`) and open dated tasks
(`status = 'TODO' AND due_date IS NOT NULL`). It merges the two sorted
lists and keeps the first `limit`. That is exact: the overall first
`limit` items can only come from the first `limit` of each list.

Each item is a `NextReminderResponse`:

```text
source   REMINDER | TASK
id       reminder id or task id, depending on source
jobId    so the dashboard can name the job and link to it
type     ReminderType for REMINDER, null for TASK
title, dueDate
```

The dashboard already has the job list, so it resolves company and
role from `jobId` in the browser; the response does not embed job
fields.

Rejected:

- One `GET /jobs/{id}/reminders` per job. It is the N+1 request pattern
  task 043 explicitly forbids for the dashboard.
- A paginated endpoint like `/timeline-events`. Page `n` of a merge of
  two tables needs either a SQL `UNION` in a native query, which
  bypasses the derived-query style every repository here uses, or
  fetching `(n + 1) * size` rows from each table. The dashboard needs
  one short list, so `limit` is enough; task 042 can add a range read
  when it knows its shape.
- Embedding `company` and `roleTitle` in the response. It is a join the
  dashboard does not need, and it would go stale in a cached response
  after a job edit.

### D8 - Job detail gets a "Reminders" tab; completed ones are shown apart

Chosen: a new tab after Contacts, following the contacts plan (D8
there). The panel shows open reminders first, ordered by date, each
with its due state as a badge ("Overdue", "Due today", or the date),
then a "Completed" group below, muted and with the title struck
through. That satisfies "completed reminders are visually distinct"
without hiding them, so a reminder completed by mistake can be
reopened.

The tab lists both kinds (D3) in one date order. It loads
`GET /jobs/{jobId}/reminders` and the existing `GET /jobs/{jobId}/tasks`,
keeps the tasks that have a `dueDate`, and merges the two by date. The
nested reminders endpoint stays a plain collection of stored reminders
that `PUT` and `DELETE` at the same path can act on; it does not mix in
task rows it cannot write.

Every row has a completion checkbox labelled with its title. A general
reminder also has Edit and Delete; Edit swaps the row into the create
form, as contacts do. A task reminder shows a "Task" label instead of a
type and has no Edit or Delete, because the task is edited in the
Tasks tab. No delete confirmation, as with contacts, notes, and tasks.

Because the Tasks and Reminders panels each load their own data when
opened, switching tabs always shows the current state of the task. No
cross-panel cache is needed.

Rejected:

- Hiding completed reminders. Nothing could then reopen one.
- A block on the Overview tab. Overview is read-only.

### D9 - The dashboard card fails on its own

"Next reminders" is a new card on the dashboard, beside recent
activity. Its request is independent of the jobs request: if it fails,
the card shows an error with a retry button and the rest of the
dashboard stays visible. If there are none, the card shows an empty
state.

Each row shows the title, the type (or "Task" for a task reminder),
company and role, and the due state, and links to the job's detail
page. The card is read-only; completing happens on job detail. Because tabs are not in the URL
(Current State), the link opens the job, not the Reminders tab.
Making tabs addressable is out of scope.

Rejected: failing the whole dashboard when reminders fail. The job
metrics are still correct and useful.

### D10 - No timeline events

Contacts, notes, and tasks do not emit timeline events and the task
does not ask for it. Reminders follow suit.

### D11 - Consequences the task file did not list

- **Shared request helpers move out of `contacts.dto`.** Reminders need
  `FourDigitYear` and the trim deserializers, which task 039 put in
  `contacts/dto`. Importing a contacts DTO file from reminders couples
  two domains; copying them duplicates a validator and two
  deserializers. Chosen: move them, unchanged, to a new
  `com.smartjobtracker.api.validation` package and update the contacts
  imports. This is a move, not a rewrite. They have no dedicated test
  file: `ContactControllerTest` covers them through the contact
  endpoints, so it is the regression check for the move.
- **Task due dates become reminder dates, and they are unguarded.**
  `CreateTaskRequest` and `UpdateTaskRequest` accept `dueDate` without
  `@FourDigitYear`, so a task due in year 10000 would break the
  Reminders tab and the dashboard card the same way it broke contacts.
  That is an existing task-API defect, not reminder scope: file it as a
  bug from `templates/bug-template.md` and fix it separately. The
  reminder date parser should still fail per row, not per list.
- New `REMINDER_NOT_FOUND` backend error code and
  `REMINDER_REQUEST_FAILED` frontend error code.
- `package.json` `api:test` and `api:test:local` allowlist folders by
  name, so a new `Reminders` folder must be added to both.
- `docs/context.md` gains the new endpoints, and its "Current State"
  mentions reminders.

## Proposed Change

### Backend

| File | Change |
| --- | --- |
| `db/migration/V8__create_reminders_table.sql` | new table, FK cascade, `idx_reminders_job_id` |
| `api/validation/*` | `FourDigitYear`, trim deserializers, moved from `contacts/dto` |
| `reminders/Reminder.kt` | entity and `ReminderType`; `type`, `title`, `dueDate`, `completedAt`, `updatedAt` are `var` |
| `reminders/ReminderRepository.kt` | `findAllByJobIdOrderByDueDateAscIdAsc`, `findByIdAndJobId`, `findAllByCompletedAtIsNullOrderByDueDateAscIdAsc(Pageable)` |
| `tasks/TaskRepository.kt` | add `findAllByStatusAndDueDateIsNotNullOrderByDueDateAscIdAsc(TaskStatus, Pageable)` for D7; read-only, no task behaviour changes |
| `reminders/ReminderService.kt` | interface + default; D4's four cases; D7's two queries and merge |
| `reminders/ReminderController.kt` | four nested endpoints, plus `GET /reminders/next` |
| `reminders/command/ReminderCommands.kt` | create/update commands |
| `reminders/dto/*` | requests, `ReminderResponse`, `NextReminderResponse` with `ReminderSource`, field limits |
| `api/error/ApiErrorCode.kt` | add `REMINDER_NOT_FOUND` |

### Frontend

| File | Change |
| --- | --- |
| `services/reminders/*` | types, endpoints, mapper, fallback-error key, tests |
| `types/job/jobDetail.types.ts`, `types/error/error.types.ts` | `TJobReminder`, `TJobReminderType`, `REMINDER_REQUEST_FAILED` |
| `features/reminders/reminders.utils.ts` | `getReminderDueState(dueDate, today)` and local-today helper (D5), shared by the tab and the dashboard |
| `features/jobDetail/useJobReminders.ts` | hook mirroring `useJobContacts`; also loads the job's tasks and completes task reminders through the tasks service (D3, D8) |
| `features/jobDetail/components/JobDetailRemindersPanel.tsx` | panel, row, form |
| `jobDetail.constants.ts`, `JobDetailActivePanel.tsx`, `TJobDetailTab` | register the `reminders` tab |
| `features/dashboard/useNextReminders.ts`, `components/DashboardNextReminders.tsx` | the card and its request (D9) |
| `pages/dashboard/DashboardPage.tsx` | place the card |
| `i18n/locales/en.json`, `de.json` | tab, panel, dashboard, type, and due-state labels |

### API collection and docs

Add a `Reminders` folder to the Postman collection (seeded job, create,
list, complete, reopen, a dated task appearing in `/reminders/next`
and leaving it once done, delete, 404), add it to both
`api:test` scripts, then update the backlog, `docs/context.md`, and the
task file at close-out.

## Tests

Backend:

- `ReminderRepositoryTest`: per-job ordering by date then id,
  `findByIdAndJobId` across jobs, the open query excludes completed
  reminders and orders across jobs.
- `ReminderPersistenceTest`: round trip including `completedAt` null
  and set; deleting a job deletes its reminders.
- `ReminderServiceTest`: create, all four D4 transitions (the "kept"
  row is the one most likely to regress), delete, unknown job, unknown
  reminder, reminder under another job, page clamping at both ends.
- `ReminderControllerTest`: status codes, validation (blank title,
  over-length title, missing type, missing `dueDate`, five-digit year),
  `completed` round trip, 404 bodies, `/reminders/next` shape including
  `source` and `jobId`, `limit` default and clamping.
- `ReminderServiceTest` for D7's merge: task-only, reminder-only,
  interleaved dates, equal dates across sources, both lists longer than
  `limit`, and that done tasks and undated tasks are excluded.
- `TaskRepositoryTest`: the new query excludes `DONE` and undated tasks
  and orders across jobs.
- `ReminderCrudIntegrationTest`: against real Postgres.
- `ContactControllerTest` still passes unchanged after the helpers
  move.
- Line and branch coverage stays at 100 per cent.

Frontend (maps to the task file's three required tests):

- `reminders.utils` test: overdue, today, and upcoming around a fixed
  "today", and completed has no due state. **Overdue reminders are
  handled.**
- Panel test: open reminders render with their due badge, completed
  ones render in the Completed group with the muted style, toggling
  completion calls the API and moves the row, add, edit, delete, error
  alert, controls labelled. **Upcoming renders; completed is distinct.**
- Panel test for task reminders: a dated task appears with a "Task"
  label and no Edit or Delete, an undated task does not appear, and
  checking it sends the task's `PUT` with `status: DONE` and its title
  and date unchanged.
- `useJobReminders` and `useNextReminders` tests, service tests,
  mapper test.
- Dashboard card test: rows with company and due state, link to job
  detail, empty state, card-level error with retry while metrics still
  render.
- Tab registration test.

## Implementation Order

1. **Move the shared validation helpers** to `api.validation`, then
   `npm run backend:test`. Expected: unresolved-reference errors in
   the contacts DTOs until their imports are updated. Visibility does
   not break: Kotlin `internal` is scoped to the module, not the
   package, so the helpers stay reachable from both domains.
2. **Migration `V8`.** Nothing fails yet.
3. **Entity, enum, repository, the new `TaskRepository` query, error
   code**, with repository and persistence tests. Expected: a derived
   query fails if its
   derived name is wrong; Spring reports it at context start-up, not
   at call time, which is worth seeing once.
4. **Commands, DTOs, service**, with service tests. Expected: a branch
   coverage gap until the "already completed, stays completed" case of
   D4 is tested.
5. **Controller**, with controller tests.
6. **`npm run backend:test`, then `backend:test:integration`.**
7. **Postman folder and allowlist**, run `api:test:local`.
8. **Frontend service, types, utils, i18n.**
9. **Hook, panel, tab registration.**
10. **Dashboard card**, then `npm run frontend:verify`.
11. **Manual browser check** in both languages.
12. **Close-out docs.**

## Verification Plan

Per `AGENTS.md` section 3, focused checks first:

- `npm run backend:test`, then `npm run backend:test:integration`
  (entity, repository, and migration changed), then
  `npm run backend:verify`.
- `npm run api:test:local` against `npm run dev:backend`, then
  `npm run api:test` against a stack rebuilt from the working tree.
- The affected Vitest files, then `npm run frontend:verify`.
- `npm run verify` last.

## Scope Boundaries

Out of scope: push, email, or browser notifications; calendar export
or sync; recurring reminders; timed reminders and timezones; linking a
reminder to a task row by id; editing or deleting a task from the
Reminders tab; a completion date on tasks; reminder notes; timeline events; a reminders
filter for completed items across jobs; URL-addressable job detail
tabs; the Calendar page (task 042); and dashboard insights (task 043).
Anything worth doing from that list becomes its own task or bug file.

## Completion Rules

Tick the task file's acceptance criteria only when the behaviour is
implemented and verified. Then update
`docs/backlog/phase-5-non-ai-workflows.md`, the recommended-next-task
line in `docs/backlog/README.md`, `docs/context.md`, and mark this plan
`Completed` with a verified-state section.

## Acceptance Criteria

- [ ] A user can add, edit, complete, reopen, and delete reminders for
  a job.
- [ ] Reminders render on job detail with type, title, and due state;
  completed reminders are visually distinct.
- [ ] Every task with a due date appears as a reminder, stays in step
  with the task with no sync code, and can be completed from the
  Reminders tab.
- [ ] Overdue, due today, and upcoming are derived from the
  browser-local date.
- [ ] The dashboard shows the next open reminders of both kinds across
  jobs, and a
  failure there does not hide the rest of the dashboard.
- [ ] Deleting a job removes its reminders.
- [ ] Backend, frontend, and API-collection tests cover the behaviour
  and `npm run verify` passes.
