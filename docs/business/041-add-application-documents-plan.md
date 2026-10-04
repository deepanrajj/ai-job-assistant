# Task 041 - Add Application Documents Plan

Status: In progress

## Purpose

Let a user record what they sent with each application - which CV
version, which cover letter, which portfolio link - and when, and see
it both on the job and across every job in one place. Metadata only:
no file storage, no PDF or DOCX generation, no AI. The task file scopes
it that way, and task 082 later adds immutable snapshots of submitted
content on top of these records.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Service, mock, Documents tab, Applications page, flag | Done; `npm run frontend:verify` passed (697 tests) |
| Backend 1-6 | Migration, entity, repository, service, controller, cross-job read | Not started (user-written) |
| API collection | `Documents` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **Dev server with the mock** (`npm run dev:local`, port 5173, real
  jobs from the backend): the Applications page grouped the mock
  documents under each real job with "Open job" links, submitted dates,
  and "Not sent yet" for the unsent portfolio link; the job detail tabs
  were Overview, Tasks, Notes, Contacts, Documents, Reminders,
  Timeline, AI, and the Documents tab showed its form and the seeded
  rows. No request reached a documents endpoint.
- **Built image** (compose, port 30080): Applications showed "Coming
  soon", the tabs had no Documents, and no documents request was made.
  The production bundle contains none of the mock's data; the only
  match for "CV - backend v3" is the form's translated placeholder.

To see it: keep the compose stack up for PostgreSQL, run
`npm run dev:local`, and open `http://localhost:5173`.

### Backend contract the frontend expects

- `GET|POST /api/jobs/{jobId}/documents` - body
  `{ type, title, url, submittedAt, notes }`
- `PUT|DELETE /api/jobs/{jobId}/documents/{documentId}` - `PUT` takes
  the same body
- `GET /api/application-documents` - plain array, each item also
  carrying `jobId`, ordered by `submittedAt` descending with unsent
  documents last
- Error code `DOCUMENT_NOT_FOUND` for an unknown document or one under
  another job.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md` (data model: `ApplicationDocument` is `id, jobId,
  type, title, contentJson, submittedAt, createdAt, updatedAt`; this
  plan changes it, see D2)
- `tasks/roadmap/041-add-application-documents.md`
- `tasks/roadmap/082-add-application-snapshots.md` (builds on this
  model)
- `docs/business/040-add-reminders-plan.md` (the feature flag and
  dev-server mock pattern this task reuses)

## Current State

Read on `main` at `6db4243`.

- **No document model** exists, in the backend or the frontend.
- **Applications** (`/applications`) is a navigation entry that renders
  `ComingSoonPage`.
- **Contacts (039)** are the closest per-job collection: a nested
  `/jobs/{jobId}/contacts` resource, a job detail tab, trimmed optional
  fields, an `http(s)` check on a link field, and a `FourDigitYear`
  guard on a date.
- **Reminders (040)** established how a frontend can merge before its
  backend: `REMINDERS_FEATURE_ENABLED` hides the UI in built images, and
  a mock runs only in the Vite dev server.
- **Task 082** expects one record per document, each with its own
  submitted date, so that marking one document submitted can snapshot
  it.

## Decisions

### D1 - A list of documents per job, not one record per job

Chosen: an `application_documents` table, many rows per job, each a
document with its own type, label, link, submitted date, and notes,
behind `/jobs/{jobId}/documents`. A job typically has one CV and one
cover letter, but a resubmission or a second portfolio piece is just
another row.

Rejected: one row per job with `cvVersion`, `coverLetterVersion`,
`portfolioUrl`, and a single `submittedAt`. It mirrors the task file's
wording most literally, but gives every document the same submitted
date, cannot hold two portfolio links, and leaves task 082 nothing to
attach a per-document snapshot to.

### D2 - Fields: `type`, `title`, `url`, `submittedAt`, `notes` (changes the locked model)

| Field | Type | Rules |
| --- | --- | --- |
| `type` | `CV`, `COVER_LETTER`, `PORTFOLIO`, `OTHER` | required, no default |
| `title` | text, 255 | required, trimmed: the version label, e.g. "CV - backend v3" |
| `url` | text, 2048 | optional, `http(s)` only: a portfolio link, or where the file lives |
| `submittedAt` | date | optional; `null` means not sent yet; four-digit year |
| `notes` | text, 5000 | optional |

This **changes the locked `ApplicationDocument` model**. The user
approved it on 2026-10-04, choosing it over keeping an unused
`contentJson` column and over one record per job:

- **`contentJson` is left out.** The task keeps this metadata-only, and
  task 082 stores submitted content in its own immutable snapshot, so a
  content column here would be empty now and the wrong home later.
- **`url` and `notes` are added.** The task asks for a portfolio link
  and document notes, and the locked model has nowhere to put them.
- **`submittedAt` is a date**, not a timestamp: users know which day
  they sent something, not the minute, as with a task's `dueDate` and a
  contact's `lastContactedAt`.

`docs/context.md` is updated on completion.

Rejected: keeping `contentJson` "for later". It would be a column no
code writes, and 082's snapshot must not be editable, which a column on
an editable row is.

### D3 - The Applications page lists every document across jobs

The Applications area gets one cross-job read,
`GET /api/application-documents`, unpaginated and ordered by
`submittedAt` descending with unsent documents last, each item carrying
`jobId`. The page groups the documents by job, shows each job's company
and role (from the jobs list it already loads), links to the job, and
shows submitted dates. A job with no documents is not listed; an empty
state explains how to add one.

Rejected:

- **One request per job.** The pattern tasks 040 and 043 ruled out.
- **Paging.** `GET /api/jobs` is unpaginated too; a user has a few
  documents per job, and a page-by-page read needs the consistency
  check task 043 had to add. Paging can come with authentication and
  real data volumes.

### D4 - A "Documents" tab on job detail

Same shape as Contacts: a create form, rows with Edit and Delete, edit
in place. Each row shows type, label, the link (opened in a new tab
with `noopener noreferrer`), "Submitted <date>" or "Not sent yet", and
notes.

### D5 - Merge the frontend first, behind a flag, with a dev-only mock

As agreed for task 040: `DOCUMENTS_FEATURE_ENABLED` is false in built
images, which hide the Documents tab and keep Applications on its
"coming soon" page; a mock of the five endpoints runs only in the Vite
dev server. The task file lists the removal steps. The backend (steps
1-6) is written by the user, as for 040.

### D6 - Validation mirrors contacts

The backend trims text and turns blank optional fields into `null`
(the shared `api.validation` helpers from 040's plan), rejects a
non-`http(s)` URL, and guards `submittedAt` with `FourDigitYear`. The
form checks the same: a required title and an `http(s)` or blank URL,
reusing the contacts URL check.

## Proposed Change

### Backend (user-written, steps 1-6)

`V9__create_application_documents_table.sql` with a cascading
`job_id` and `idx_application_documents_job_id`; a `documents` package
with entity and `DocumentType`, repository (`findAllByJobId...`,
`findByIdAndJobId`, an all-documents query ordered for D3), service,
controller (four nested routes plus `GET /application-documents`),
commands, DTOs, field limits; `DOCUMENT_NOT_FOUND`; Postman
`Documents` folder and the `api:test` allowlist.

### Frontend (this change)

| File | Change |
| --- | --- |
| `services/documents/*` | types, endpoints, mapper, payload builder, dev-only mock |
| `types/job/jobDetail.types.ts`, `types/error/error.types.ts` | `TJobDocument`, `TJobDocumentType`, `DOCUMENT_REQUEST_FAILED`, `documents` tab |
| `features/documents/documents.constants.ts` | `DOCUMENTS_FEATURE_ENABLED` |
| `features/jobDetail/useJobDocuments.ts`, `components/JobDetailDocumentsPanel.tsx` | the tab (D4) |
| `features/applications/*`, `pages/applications/*`, `routes/modules/applicationsRoute.tsx` | the cross-job page (D3) |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

- Panel: documents render with submitted date and link, "Not sent yet",
  add with only the required fields, blank optionals sent as `null`,
  invalid URL blocked, edit, delete, errors, empty state with an
  accessible heading.
- Hook, service, mapper, payload, and mock tests.
- Applications page: grouped by job with links and submitted dates,
  empty state, load error, jobs and documents loaded once each.
- Flag: Documents tab and Applications content absent when off; the
  route keeps "coming soon".

## Implementation Order

1. Types, service, mock, and their tests.
2. Hook and Documents tab, then the tab registration behind the flag.
3. Applications page and route.
4. `npm run frontend:verify`, then a look in the dev server with the
   mock, and in the compose image to confirm the UI is hidden.
5. Backend steps 1-6 with the user, then remove the mock and flag.

## Verification Plan

The affected Vitest files, `npm run frontend:verify`, `npm run verify`,
the dev server in both languages, and the built image with the feature
hidden. The backend half adds `backend:test`,
`backend:test:integration`, and `api:test:local`.

## Scope Boundaries

Out of scope: file upload or storage, PDF/DOCX generation, AI-generated
documents, submitted-content snapshots (task 082), paging, a document
filter or search, and reminders or calendar entries for documents
(task 042 reads submitted dates later).

## Completion Rules

The frontend can merge behind the flag. The task completes once the
backend lands and the mock and flag are removed; then tick the task
file, update `docs/backlog/phase-5-non-ai-workflows.md`, the
recommended-next-task line, `docs/context.md`, and mark this plan
`Completed`.

## Acceptance Criteria

- [ ] A user can add, edit, and delete documents for a job, with type,
  label, link, submitted date, and notes.
- [ ] The Applications page lists every job's documents with submitted
  dates and links to each job.
- [ ] Empty states are accessible; invalid links are rejected by the
  form and the API.
- [ ] No file storage is introduced.
- [ ] Backend, frontend, and API-collection tests pass and the mock and
  flag are removed.
