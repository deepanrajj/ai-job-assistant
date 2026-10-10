# Task 047 - Add Import Candidate Review Workflow Plan

Status: In progress

## Purpose

Let a user collect job opportunities as **candidates** before any of
them becomes a saved job: paste a job description, enter or correct the
company, role, location, and an optional source link, save it as a
candidate, then review the candidates on Discover and mark which ones to
import. Turning selected candidates into jobs is task 049, after task
048 classifies duplicates. No AI, no provider, no fetching links.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Service, validation, mock, hook, intake form, review list, route, flag | Done; `npm run frontend:verify` passed (812 tests) |
| Backend | `/api/import-candidates` CRUD on the locked model (D1) | Not started (user-written) |
| API collection | `Import candidates` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **The task's tests**: candidates render apart from jobs; selection,
  select all, and clear; the empty review list; a candidate created in
  one hook instance is there after a fresh load, with no request to
  `/api/jobs`; missing fields, a non-`http(s)` link, and a failed save
  keep the draft with errors; pasted `<script>` and `<b>` render as text
  with no element created.
- **Dev server with the mock** (port 5173) at 375 px and 1280 px: a
  pasted `<b>Own</b>` description saved and showed as literal text with
  its line break; the new candidate was selectable; the page made no
  request to `/api/jobs`, to the source link, or to the real candidate
  endpoint, and nothing scrolled sideways.
- **Built image** (compose, port 30080): Discover shows "Coming soon".

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md` (`ImportCandidate` is `id, userId, source,
  sourceUrl, contentJson, duplicateStatus, reviewStatus`; this plan
  keeps it)
- `tasks/roadmap/047-add-import-candidate-review-workflow.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Non-AI Import Needs An Intake")
- `docs/business/046-add-discover-saved-searches-plan.md` (same page)

## Current State

Read on `feat/task-046-add-discover-saved-searches` at `35d6ece`
(stacked on PR #64).

- **Discover** has 046's saved searches behind
  `SAVED_SEARCHES_FEATURE_ENABLED`.
- No candidate model exists; the locked one fits manual intake as is.
- **Jobs** are created only through `POST /api/jobs` from the job form.

## Decisions

### D1 - Keep the locked model; the job's fields live in `contentJson`

| Column | Value for a manual candidate |
| --- | --- |
| `source` | `MANUAL` (enum; CSV, extension, and AI sources are later work) |
| `sourceUrl` | optional, `http(s)` only, never fetched |
| `contentJson` | `{ company, roleTitle, location, description }` |
| `duplicateStatus` | `UNCHECKED` until task 048 classifies it |
| `reviewStatus` | `PENDING` (task 049 sets `IMPORTED`) |

API: `GET /api/import-candidates`, `POST`, `PUT /{id}` (correct a
saved candidate), `DELETE /{id}`. Body `{ sourceUrl, content }`; the
server sets `source`, `duplicateStatus`, and `reviewStatus` on create.
`company`, `roleTitle`, and `description` are required and nonblank
(trimmed); `location` is optional. `userId` joins with task 052.

### D2 - Creating a candidate never creates a job

Candidates have their own endpoint and their own list on Discover; the
Jobs list and dashboard never show them. A test asserts candidate
intake sends nothing to `/api/jobs`.

### D3 - Selection is a review choice in the browser

Each candidate has a checkbox, with "Select all" and "Clear selection",
and a count of selected candidates. Selection is not persisted: it is
the user's working choice for the import action task 049 adds, and
storing it would add a write per click for no benefit yet.

Rejected: a persisted `SELECTED` review status. It changes nothing
another device or a later visit needs.

### D4 - Descriptions are text, links are not followed

The pasted description renders as plain text in a `whitespace-pre-wrap`
block, so markup such as `<script>` or `<b>` shows as typed and never
runs; React escapes it, and nothing uses `dangerouslySetInnerHTML`.
The source link renders as an anchor (`noopener noreferrer`) only when
it is `http(s)`; the app never requests it.

### D5 - Intake form keeps the draft on every failure

Validation errors show under each field and the Save button stays
disabled until required fields are filled and the link is valid; a
failed save shows the error and keeps every value.

### D6 - On the Discover page, behind its own flag

The candidates section sits below the saved searches.
`IMPORT_CANDIDATES_FEATURE_ENABLED` hides it in built images; a dev-only
mock seeds two candidates.

## Proposed Change

| File | Change |
| --- | --- |
| `services/importCandidates/*` | types, CRUD, validation helpers, dev-only mock |
| `features/discover/*` | flag, hook, intake form, candidate list |
| `routes/modules/discoverRoute.tsx` | add the section when its flag is on |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

The task's list: candidates render apart from jobs; selection, select
all, and clear; empty review list; create and reload without AI or
provider calls; missing fields, invalid link, and a failed save keep the
draft with useful errors; intake sends nothing to `/api/jobs`; pasted
markup renders as text. Plus service, mock, hook, and route.

## Implementation Order

Service, validation, and mock; hook; intake form; list; route and
translations; `npm run frontend:verify`; dev server and built image.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, the dev server with
the mock at phone and desktop width, and the built image hiding it.

## Scope Boundaries

Out of scope: importing candidates as jobs (049), duplicate
classification (048), AI discovery, providers, extracting fields from
the text, fetching URLs, CSV, browser extensions, and the backend in
this change.

## Completion Rules

The frontend can merge behind the flag. The task completes once the
backend lands and the mock and flag are removed.

## Acceptance Criteria

- [ ] Manual intake creates persisted candidates, with errors that keep
  the draft.
- [ ] Candidates are reviewable and selectable, apart from saved jobs.
- [ ] Intake never creates a job; markup renders as text.
- [ ] The backend exists and the mock and flag are removed.
