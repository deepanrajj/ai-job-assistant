# Task 049 - Add Bulk Import Selected Jobs Plan

Status: In progress

## Purpose

Turn the candidates a user selected and confirmed into saved jobs, in
one action, keeping where each came from, and say clearly which ones
were imported and which failed. Nothing is imported without an explicit
confirmation, and nothing is imported automatically.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Mapping, service, mock, hook action, confirmation, feedback, imported rows | Done; `npm run frontend:verify` passed (846 tests) |
| Backend | `POST /api/import-candidates/import` (D1), with 047's candidate backend | Not started (user-written) |
| API collection | Import request in the candidates folder | Not started |

### Verified so far

- **Tests**: only selected candidates are sent, and only after the
  confirmation; cancelling sends nothing; the button is disabled with
  nothing selected; the confirmation warns about selected likely
  duplicates; per-candidate failures are named with their reason next to
  the successes; imported candidates are marked, unselectable, and not
  editable; the D2 mapping, including source inference, and the mock's
  per-candidate results and failure handling.
- **Dev server against the real backend** (port 5173): with Zalando
  unselected, importing N26 showed a confirmation naming only N26, then
  "Imported 1 as saved jobs"; `GET /api/jobs` went from 3 to 4 jobs, the
  new one `WISHLIST` with the candidate's role, location, and link, and
  no source (the link's host is not a known board); Zalando was not
  imported; the job appeared in the Jobs list; the N26 candidate's
  checkbox was disabled. The test job was deleted afterwards.

### Backend contract the frontend expects

- `POST /api/import-candidates/import` with `{ candidateIds }`
- `200 { results: [{ candidateId, outcome, jobId, errorCode }] }`, one
  per requested id; `outcome` `IMPORTED` or `FAILED`; error codes
  `IMPORT_CANDIDATE_NOT_FOUND` and `IMPORT_CANDIDATE_ALREADY_IMPORTED`
- Each candidate in its own transaction: create the job through
  `JobService.createJob` with D2's mapping and set `reviewStatus`
  `IMPORTED`, together.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/049-add-bulk-import-selected-jobs.md`
- `docs/business/047-add-import-candidate-review-workflow-plan.md`
- `docs/business/048-add-import-duplicate-detection-plan.md`

## Current State

Read on `feat/task-048-add-import-duplicate-detection` at `628335d`
(stacked on PR #66).

- 047's candidates are `PENDING`, selectable, behind
  `IMPORT_CANDIDATES_FEATURE_ENABLED`; 048 preselects new and possible
  ones and leaves likely duplicates unselected.
- Jobs are created by `POST /api/jobs` (`JobService.createJob`), with
  `company`, `roleTitle`, `location`, `status`, `source` (task 038:
  `LINKEDIN`, `INDEED`, `XING`, `COMPANY_WEBSITE`, `AI_SEARCH`,
  `REFERRAL`, `OTHER`), `jobUrl`, and `description`.

## Decisions

### D1 - One import endpoint that reuses job creation on the server

`POST /api/import-candidates/import` with `{ candidateIds }` imports
each listed candidate in its own transaction: it creates the job
through the existing `JobService.createJob` and sets the candidate's
`reviewStatus` to `IMPORTED`, together, so a candidate is never left
`PENDING` with its job already saved. The response reports every
candidate:

```text
results: [{ candidateId, outcome: IMPORTED | FAILED, jobId, errorCode }]
```

One candidate failing does not stop the others. An unknown or already
imported candidate is `FAILED` with an error code.

Rejected:

- **The browser calling `POST /api/jobs` per candidate, then updating
  each candidate.** Two writes per candidate with nothing tying them:
  a failure between them saves the job and leaves the candidate
  importable again.
- **All-or-nothing import.** One bad candidate would block the rest,
  and the user asked to import all of them.

### D2 - How a candidate becomes a job

| Job field | From the candidate |
| --- | --- |
| `company`, `roleTitle`, `location`, `description` | its content |
| `jobUrl` | its source link |
| `status` | `WISHLIST`: saved, not applied |
| `source` | from the link's host: `linkedin.com` → `LINKEDIN`, `indeed.*` → `INDEED`, `xing.com` → `XING`; otherwise not set |

The source is only inferred where the host says it unambiguously; a
company careers page and an aggregator look alike, so anything else is
left unset rather than guessed.

### D3 - Confirmation on the page, likely duplicates called out

"Import selected" opens an inline confirmation listing the selected
candidates, warning when any likely duplicate is among them, with
"Import N as jobs" and "Cancel". No browser dialog. Duplicates are not
blocked: the user chose them, and blocking beyond the default selection
is out of scope. 048's note that 049 should re-check duplicates on the
server is therefore not needed: the server does not decide by
duplicates at all.

### D4 - Feedback, and imported candidates stay visible

After the import, a status message says how many were imported, and an
alert names each failed candidate with its reason. Imported candidates
stay in the list marked "Imported", with their checkbox disabled, so
the user can see what happened; they are never selected again. The
saved-jobs list reloads, so the remaining candidates are re-checked
against the new jobs.

### D5 - Frontend first; the dev mock uses the real job endpoint

The mock of the import endpoint calls the real `POST /api/jobs` for
each candidate with D2's mapping, so in the dev server the imported
jobs really appear in Jobs. The mapping is exported and tested, as the
contract the backend follows.

## Proposed Change

| File | Change |
| --- | --- |
| `services/importCandidates/*` | `IMPORTED` status, import types, `importCandidatesAsJobs`, D2 mapping, mock |
| `features/discover/useImportCandidates.ts` | an import action that marks imported candidates |
| `features/discover/components/ImportCandidatesSection.tsx` | import button, confirmation, feedback, imported rows |
| `routes/modules/discoverRoute.tsx` | reload jobs after an import |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

Selected candidates are sent and unselected ones are not; nothing is
sent until the confirmation is accepted, and cancelling sends nothing;
success and failure feedback; imported candidates are marked and
unselectable; the D2 mapping including source inference; the mock
creates jobs through `POST /api/jobs` and reports per-candidate results.

## Implementation Order

Mapping and service with tests, mock, hook, section, route, and
translations; `npm run frontend:verify`; dev server import into the
real jobs list.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, and a dev-server
import checked in the Jobs list.

## Scope Boundaries

Out of scope: AI discovery, automatic import, blocking duplicates,
undoing an import, and the backend in this change.

## Completion Rules

The frontend can merge behind 047's flag. The task completes once the
import endpoint exists and 047's mock and flag are removed.

## Acceptance Criteria

- [ ] Selected, confirmed candidates become saved jobs; unselected ones
  do not.
- [ ] Imported jobs keep the company, role, location, description, and
  source link, with the source inferred where unambiguous.
- [ ] Import success and per-candidate failures are shown.
- [ ] The import endpoint exists and the mock is removed.
