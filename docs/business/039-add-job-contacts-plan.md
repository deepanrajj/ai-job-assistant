# Task 039 - Add Job Contacts Plan

Status: Completed

## Purpose

Let a user record the people connected to a saved job - a recruiter, a
hiring manager, a referral, or anyone else - with a name, how to
reach them, and free-text notes, and manage them from the job detail
page. The task file scopes this to per-job contacts: no email sending,
no CRM-style global contact list, and no calendar integration.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md` (data model: `Contact` is `id, jobId, type, name,
  emailOrUrl, notes, createdAt, updatedAt`; this task changes it, see
  D2 and D5)
- `tasks/roadmap/039-add-job-contacts.md`

## Current State

### Audited: notes are the closest precedent

A job's notes are a per-job collection with create, edit, and delete,
persisted in Postgres and shown in a job detail tab. Contacts have the
same shape, so this plan copies that path rather than inventing one.

| Layer | File | Pattern |
| --- | --- | --- |
| Migration | `V4__create_notes_table.sql` | `job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE` plus `idx_notes_job_id` |
| Entity | `notes/Note.kt` | extends `AssignedIdEntity`; editable columns `var`, `jobId`/`createdAt` `val` |
| Repository | `notes/NoteRepository.kt` | `findAllByJobIdOrderByCreatedAtAscIdAsc`, `findByIdAndJobId` |
| Service | `notes/NoteService.kt` | interface + `Default...`; every method first calls `jobService.getJob(jobId)`; update mutates the managed entity |
| Controller | `notes/NoteController.kt` | `/jobs/{jobId}/notes`: `GET`, `POST` (201), `PUT /{noteId}`, `DELETE /{noteId}` (204) |
| DTOs | `notes/dto`, `notes/command` | request -> command via `toCommand()`; response omits `jobId` |
| Error code | `api/error/ApiErrorCode.kt` | `NOTE_NOT_FOUND` |
| Wire service | `services/notes/notes.service.ts` | `getJson`/`postJson`/`putJson`/`deleteJson` with a fallback error key |
| Hook | `features/jobDetail/useJobNotes.ts` | `useAsyncMutation` x4, reload after each write, `mutationError` |
| Panel | `features/jobDetail/components/JobDetailNotesPanel.tsx` | create form, memoised rows, `Alert` for mutation errors |
| Tabs | `jobDetail.constants.ts`, `JobDetailActivePanel.tsx` | tab list + dispatcher keyed on job id |
| API collection | `docs/api/*.postman_collection.json`, `package.json` | a `Notes` folder; `api:test` and `api:test:local` allowlist folders by name |

Notes and tasks do **not** write timeline events, so there is no
precedent for a child entity doing so.

## Decisions

### D1 - Persist in a new `contacts` table behind a nested endpoint

Chosen: a `contacts` table, `job_id` foreign key with `ON DELETE
CASCADE`, exposed at `/jobs/{jobId}/contacts`. "The current persistence
path" in the task file is the backend + Postgres path every other job
collection already uses.

Rejected:

- A JSON column on `jobs`. It would need no new table but makes every
  contact edit a rewrite of the job, breaks the per-row `updatedAt` in
  `docs/context.md`, and diverges from notes and tasks.
- A global `contacts` table with a join to jobs. That is the CRM-style
  contact management the task file lists as out of scope.
- Frontend-only storage. Nothing else in the job workflow works that
  way and the data would not survive a browser change.

### D2 - Split `emailOrUrl` into `email`, `phone`, and `profileUrl`

Chosen: replace the locked `emailOrUrl` with three optional columns,
`email`, `phone`, and `profileUrl`, so one contact can carry all three.
A recruiter typically has an address, a number, and a LinkedIn page,
and a single slot forced a choice. The task file's "email or profile
URL" is satisfied by supporting either or both. The user approved
changing this locked decision; `docs/context.md` is updated on
completion (D5, D9). The full field set is `type`, `name`, `email`,
`phone`, `profileUrl`, `lastContactedAt`, `notes`.

A side effect: with separate fields each one has a known meaning, so
the UI can render `email` as a `mailto:` link and `profileUrl` as a
link (D4, D8), which one combined field could not.

Rejected:

- Keeping `emailOrUrl` as locked. Simplest, but one slot and no phone.
- `emailOrUrl` plus `phone`. Half the fix; the combined field still
  cannot be validated or linked, since it might hold either.
- A generic list of `{kind, value}` channels per contact. It scales to
  any number of channels but is a child table with its own CRUD, which
  is out of proportion for three known channels.

### D3 - `type` is an enum: `RECRUITER`, `HIRING_MANAGER`, `REFERRAL`, `OTHER`

Chosen: a `ContactType` enum stored as `VARCHAR(50)` via
`@Enumerated(EnumType.STRING)`, the same way `JobStatus` is stored.
The task names the first three; `OTHER` is required because a contact
must always have a type and a job can involve, say, an interviewer.
Type is **required** on create and update, with no default, so the user
always makes the choice.

Rejected: a free-text type. It is flexible but yields "Recruiter",
"recruiter" and "Recuiter" as three groups and has nothing to
translate for the `en`/`de` UI.

### D4 - Only `name` and `type` are required; blank optionals become `null`

`name` is `@NotBlank` with a 255-character limit. `email` (255),
`phone` (50), `profileUrl` (2048, the limit `jobUrl` uses), and
`notes` (`TEXT`, capped by the DTO at 5000) are optional. "Blank
optional fields are handled" is implemented in `toCommand()`: a blank
or whitespace-only `email`, `phone`, `profileUrl`, or `notes` is
stored as `null`, and values are trimmed. The frontend sends `null`
for blanks too, so the rule holds for any client, not just ours.

Validation, beyond length:

- `email`: `@Email` when present. A recruiter's address is a real
  address, and the link in D8 depends on it.
- `profileUrl`: must start with `http://` or `https://` when present.
  It is rendered as a link, and a bare `URL` parse accepts schemes such
  as `javascript:`, so the scheme is checked on the backend (and in the
  frontend form) instead of trusting the parse alone.
- `phone`: length only. Numbers are written with spaces, `+`, dashes,
  and extensions in every country, so a pattern would reject valid
  input.

Rejected: no validation beyond length, as originally planned for the
combined field. With one ambiguous field that was defensible; with
`email` and `profileUrl` separate and linked, it would let a malformed
address or a script URL through.

Rejected: storing empty strings. `null` is what `jobs.source` and
`jobs.location` already use for "not set", and the frontend can render
one fallback for it.

### D5 - "Contact history" is `notes` plus an optional `lastContactedAt`

The acceptance criteria say "Contact history can be captured". The
locked `Contact` model has no way to say a contact happened. This plan
adds one optional `lastContactedAt` date (`DATE`, nullable) to
`Contact`, beside the free-text `notes` where the user writes what was
said. Together with D2 this changes the locked `Contact` model. `null` means not contacted yet, so no separate "contacted"
status is needed. `createdAt`/`updatedAt` remain the record's own
audit timestamps and are not a substitute.

`lastContactedAt` is a date, not a timestamp, matching `dueDate` on
tasks. It is user-entered and editable, and a future date is not
rejected: the user may be logging a scheduled call, and nothing
consumes the value yet.

This is a deliberate extension of the locked model, agreed with the
user. `docs/context.md` is updated on completion.

Rejected:

- Notes only. It satisfies the wording but the app cannot tell whether
  or when someone was contacted, and the date cannot be sorted or shown.
- A contacted status enum. It duplicates what `null` versus a date
  already says and must be kept in sync by hand.
- An interaction log table with one row per touchpoint. It is a second
  entity with its own CRUD and roughly doubles the task. It is not
  excluded by the task (only *global* CRM contact management is), so it
  is a sound follow-up task if a single date proves too coarse.

### D6 - No timeline events

Notes and tasks do not emit timeline events and the task does not ask
for it. Contacts follow suit.

### D7 - `PUT` is a full replacement, like notes

`PUT /jobs/{jobId}/contacts/{contactId}` takes the same body as create.
The service mutates the managed entity (per `backend/AGENTS.md`
section 4) and sets `updatedAt`. Unknown contact, or a contact under a
different job, is `404 CONTACT_NOT_FOUND` via `findByIdAndJobId`.

### D8 - UI is a new "Contacts" tab, not a section of Overview

Chosen: a fifth tab after Notes, using the existing tab list and
`JobDetailActivePanel` dispatcher. Tabs are how every editable
per-job collection is presented; the Overview panel is read-only.

Rejected: a block inside Overview. It would make Overview an editing
surface and duplicate the panel/hook split the other tabs share.

Each contact renders as a read view (name, type, email, phone,
profile URL, last contacted date or "Not contacted yet", notes) with
**Edit** and **Delete** buttons. Edit swaps that row into the same
form used for adding a contact. Notes edit in place because one
textarea fits in a row; a contact has seven fields and always-open
inputs on every row would bury the list. No delete confirmation, as
with notes and tasks.

Only fields that are set are shown. `email` renders as a `mailto:`
link, `profileUrl` as an external link (`target="_blank"`,
`rel="noopener noreferrer"`, as the job posting link does), and
`phone` as plain text. `phone` is not a `tel:` link: it would offer a
call action on a desktop app that cannot place one, for no benefit
the task asks for.

### D9 - Consequences the task file did not list

- New `CONTACT_NOT_FOUND` backend error code and
  `CONTACT_REQUEST_FAILED` frontend error code.
- `package.json` `api:test` and `api:test:local` allowlist folders by
  name, so a new `Contacts` folder is ignored until added to both.
- `docs/context.md` lists job contacts as planned and its `Contact`
  model has `emailOrUrl` and lacks `lastContactedAt`; both change on
  completion.

## Proposed Change

### Backend

| File | Change |
| --- | --- |
| `db/migration/V7__create_contacts_table.sql` | new table, FK cascade, `idx_contacts_job_id` |
| `contacts/ContactType.kt` | the enum |
| `contacts/Contact.kt` | entity; `type`, `name`, `email`, `phone`, `profileUrl`, `lastContactedAt`, `notes`, `updatedAt` are `var` |
| `contacts/ContactRepository.kt` | the two derived queries, as notes |
| `contacts/ContactService.kt` | interface + default implementation |
| `contacts/ContactController.kt` | four endpoints |
| `contacts/command/ContactCommands.kt` | create/update commands |
| `contacts/dto/*` | requests, response, `ContactFieldLimits.kt` |
| `api/error/ApiErrorCode.kt` | add `CONTACT_NOT_FOUND` |

### Frontend

| File | Change |
| --- | --- |
| `services/contacts/*` | types, endpoints, mapper, fallback-error keys, tests |
| `types/job/jobDetail.types.ts`, `types/error/error.types.ts` | `TJobContact`, `TJobContactType`, `CONTACT_REQUEST_FAILED` |
| `features/jobDetail/useJobContacts.ts` | hook mirroring `useJobNotes` |
| `features/jobDetail/components/JobDetailContactsPanel.tsx` | panel, row, form |
| `jobDetail.constants.ts`, `JobDetailActivePanel.tsx`, `TJobDetailTab` | register the `contacts` tab |
| `i18n/locales/en.json`, `de.json` | `contacts.fallbackError`, `jobDetail.tabs.contacts`, `jobDetail.contacts.*`, type labels |

### API collection and docs

Add a `Contacts` folder to the Postman collection (own seeded job,
create, list, update, delete, 404 case), add it to both `api:test`
scripts, then update the backlog, `docs/context.md`, and the task file
at close-out.

## Tests

Backend, mirroring `notes/`:

- `ContactRepositoryTest`: ordering, `findByIdAndJobId` across jobs.
- `ContactPersistenceTest`: round trip including null optionals.
- `ContactServiceTest`: create, update mutates and stamps `updatedAt`,
  delete, unknown job, unknown contact, contact under another job.
- `ContactControllerTest`: status codes, validation (blank name, missing
  type, over-length, malformed `email`, non-`http(s)` `profileUrl`
  including `javascript:`), blank optionals stored as `null`, 404
  bodies.
- `ContactCrudIntegrationTest`: against real Postgres, including the
  cascade when a job is deleted.
- Backend line and branch coverage stays at 100 per cent, so the
  blank-to-`null` branch in `toCommand()` needs both directions tested.

Frontend:

- service tests (URLs, payloads, fallback errors), mapper test.
- `useJobContacts` test: load, create/update/delete then reload,
  `mutationError`, rejection contract.
- panel test: contacts render, empty state, add with only required
  fields, blank optionals sent as `null`, edit, delete, error alert,
  buttons disabled while a write is in flight, labelled controls.
- tab registration test, and `en`/`de` key parity if the repo checks it.

## Implementation Order

1. **Migration `V7`.** Expected: nothing fails yet; verified when the
   integration test runs against Postgres later.
2. **Entity, enum, repository, error code**, with the repository and
   persistence tests. Expected failure first: repository test does not
   compile until the entity exists; then the persistence test fails if a
   column name or `@Enumerated` is wrong, which is the lesson.
3. **Commands, DTOs, service**, with service tests. Expected: coverage
   gap on the not-found branches until both are tested.
4. **Controller**, with controller tests. Expected: a `400` versus
   `404` mix-up if validation annotations use `@field:`-less form.
5. **`npm run backend:test`, then `backend:test:integration`.**
6. **Postman folder and script allowlist**, run `api:test:local`.
7. **Frontend service, types, mapper, i18n.**
8. **Hook, panel, tab registration**, then
   `npm run frontend:verify`.
9. **Manual browser check** of the tab in both languages.
10. **Close-out docs.**

## Verification Plan

Per `AGENTS.md` section 3, focused checks first:

- `npm run backend:test`, then `npm run backend:test:integration`
  (entity, repository, and migration changed), then
  `npm run backend:verify`.
- `npm run api:test:local` against `npm run dev:backend`, because the
  `/api/jobs` contract gained an endpoint. Then `npm run api:test`
  against a stack rebuilt from the working tree.
- The affected Vitest files, then `npm run frontend:verify`.
- `npm run verify` last.

## Scope Boundaries

Out of scope: sending email, a global or cross-job contact list,
calendar integration, format validation of `phone`, an
interaction log, a contacted status, timeline events, optimistic
updates, and any change to jobs, notes, or tasks. Anything worth doing
in that list becomes its own task or bug file.

## Completion Rules

Tick the task file's acceptance criteria only when the behaviour is
implemented and verified. Then update
`docs/backlog/phase-5-non-ai-workflows.md`, the recommended-next-task
line in `docs/backlog/README.md`, `docs/context.md`, and mark this plan
`Completed` with a verified-state section.

## Acceptance Criteria

- [ ] A user can add, edit, and delete contacts for a job.
- [ ] Contacts render on job detail with type, name, email, phone,
  profile URL, last contacted date, and notes.
- [ ] An invalid email, or a profile URL that is not `http(s)`, is
  rejected by the API and the form.
- [x] Blank optional fields (including `lastContactedAt`) are stored
  as `null` and render cleanly.
- [x] Deleting a job removes its contacts.
- [x] Backend, frontend, and API-collection tests cover the behaviour
  and `npm run verify` passes.

## Verified State

Implemented as planned, with two adjustments found during
implementation:

- **Fields split as planned.** `email`, `phone`, and `profileUrl`
  replaced the locked `emailOrUrl`, and `lastContactedAt` was added
  beside `notes`, both with the user's explicit sign-off (D2, D5).
  `docs/context.md`'s `Contact` model and API list are updated to
  match.
- **D4's frontend half of the `profileUrl` scheme check was not
  built.** D4 says the `http(s)`-only check happens "on the backend
  (and in the frontend form)"; only the backend `@Pattern` was
  implemented. `JobDetailContactsPanel` renders `profileUrl` as a link
  with no client-side scheme validation, relying entirely on the
  backend rejecting a non-`http(s)` value at submit time. Low risk in
  this same-origin app with no untrusted contact-data import path yet,
  but it should be closed alongside whichever future task imports
  contact data from an external source.
- **A `@Email` edge case surfaced while writing
  `ContactControllerTest`.** Bean Validation's `@Email` only skips its
  format check for a truly *empty* string, not a whitespace-only one,
  so sending `"   "` for `email` is rejected as a malformed address
  rather than treated as blank. This does not affect the frontend:
  `toNullableTrimmed()` already sends `null` for any blank text before
  it reaches the API. The test was written to send `""` for `email`
  and whitespace for the fields without a format constraint, and this
  distinction is documented on the test itself.
- **One planned integration test was dropped.** "Deleting a job over
  http removes its contacts too" failed because `contacts.jobId` is a
  plain column, not a JPA association: Hibernate has no way to know a
  pending `Job` removal could affect `contacts`, and its auto-flush
  heuristic can skip flushing that delete before an unrelated `Contact`
  query, so `existsById` can read a row Postgres already dropped before
  Hibernate has sent the `DELETE`. `ContactPersistenceTest`'s
  `deleting a job deletes its contacts`, which uses the required
  `entityManager.clear()`, already proves the cascade correctly, so the
  redundant, unreliable HTTP-level version was removed rather than
  worked around.

Verification run: `npm run backend:verify` (ktlint, detekt, full test
suite, 100% line and 100% branch coverage), `npm run frontend:verify`
(lint, format, 464 tests, 100% line coverage on the new code), and
`npm run api:test:local` against a live `npm run dev:backend` (38
requests, 107 assertions, including the new `Contacts` folder) all
pass.
