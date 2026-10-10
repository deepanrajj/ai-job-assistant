# Task 048 - Add Import Duplicate Detection Plan

Status: Completed

## Purpose

Before any candidate is imported, say which ones the user has probably
saved already: classify each candidate as new, a possible duplicate, or
a likely duplicate of a saved job, explain why, and leave likely
duplicates out of the default import selection while still letting the
user pick them. Deterministic rules only: no AI, no scoring service.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md` ("Duplicate detection has two product modes")
- `tasks/roadmap/048-add-import-duplicate-detection.md`
- `tasks/roadmap/050-add-manual-duplicate-warning.md` (reuses these
  rules)
- `docs/business/047-add-import-candidate-review-workflow-plan.md`

## Current State

Read on `feat/task-047-add-import-candidate-review-workflow` at
`82c120d` (stacked on PR #65).

- 047's candidate review lists candidates with "Duplicates not
  checked" and an empty selection, behind
  `IMPORT_CANDIDATES_FEATURE_ENABLED`.
- Saved jobs come from `GET /api/jobs`, which exists, with `company`,
  `roleTitle`, optional `location`, and optional `jobUrl`.
- The locked `ImportCandidate` has a `duplicateStatus` column; 047
  stores `UNCHECKED`.

## Decisions

### D1 - Classify in the browser at review time; do not persist it

The candidate review already has every saved job (one `GET /api/jobs`),
so a pure utility classifies each candidate when the list renders. A
candidate's duplicate status changes whenever the user saves, edits, or
deletes a job, so a stored value would be stale by the next visit; a
derived one never is. This needs no backend change, so the task is
complete on the frontend alone.

The persisted `duplicateStatus` stays `UNCHECKED`. Task 049, which
imports on the server, should re-check there with the same rules rather
than trust a client-side answer; that is noted for 049.

Rejected: classifying on the backend at candidate creation and storing
it. It goes stale the moment the jobs change, and it would make this a
backend task for no gain at review time.

### D2 - The rules, strongest first

Values are normalized before comparing: lower-cased, accents removed,
punctuation turned into spaces, whitespace collapsed. Company names also
drop legal suffixes (`gmbh`, `ag`, `se`, `kg`, `inc`, `ltd`, `llc`,
`corp`, `co`, and similar). URLs compare by host without `www.`, path
without a trailing slash, and query without `utm_*` parameters; the
fragment is ignored and the scheme does not matter.

| Signal | Classification |
| --- | --- |
| Same normalized URL as a job's `jobUrl` | Likely duplicate |
| Same company and same role title | Likely duplicate |
| Same company and similar role title (at least half the words shared, e.g. "Senior Backend Engineer" and "Backend Engineer") | Possible duplicate |
| Same role title and same location, any company (e.g. an agency posting) | Possible duplicate |
| None of the above | New |

A candidate takes the strongest classification any job gives it, and
the review shows the reason and the matching job, e.g. "Likely
duplicate: same link as Backend Engineer at N26".

Rejected: edit-distance or fuzzy scores. They need thresholds tuned on
data the project does not have, and their results are hard to explain;
word overlap is deterministic and easy to state.

### D3 - Likely duplicates start unselected; the user can still pick them

New and possible duplicates start selected, likely duplicates start
unselected. "Select new and possible" restores that default, "Clear
selection" unselects everything, and any candidate - a likely duplicate
included - can be checked by hand. Selection is held as overrides on
top of the default, so the default follows the classification without
an effect copying state.

Until the jobs load, candidates show "Checking for duplicates" and
nothing is preselected; if the jobs fail to load, they show "Could not
check for duplicates" and nothing is preselected either, since a likely
duplicate could not be excluded.

### D4 - A shared utility in `features/duplicates`

The rules live in `features/duplicates/duplicates.utils.ts`, taking a
plain `{ company, roleTitle, location, url }` input, so task 050 can
check the job form against the same rules.

## Proposed Change

| File | Change |
| --- | --- |
| `features/duplicates/*` | normalization, `classifyDuplicate`, types, labels |
| `features/discover/components/ImportCandidatesSection.tsx` | status and reason per candidate, default selection, select controls |
| `routes/modules/discoverRoute.tsx` | pass the jobs list to the section |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

- Utility: same URL (scheme, `www.`, slash, `utm_*`, fragment all
  ignored) is likely; same company and role, across legal suffixes and
  case, is likely; similar role at the same company is possible; same
  role and location at another company is possible; unrelated is new;
  strongest classification wins; a different query parameter such as a
  job id is not the same URL.
- Section: statuses and reasons render; likely duplicates start
  unselected and new and possible ones selected; a likely duplicate can
  be checked by hand; select-default and clear; loading and failed jobs
  preselect nothing.

## Implementation Order

Normalization and classification with tests first, then the section,
route, and translations; `npm run frontend:verify`; dev server check
with a mock candidate matching a real job.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, and the dev server.

## Scope Boundaries

Out of scope: AI similarity, blocking manual job creation (050 only
warns), cross-user detection, persisting the classification, importing
(049), and any backend change.

## Completion Rules

No backend work: tick the task file and the phase backlog once
verified. The classification is visible in built images when 047's flag
is removed.

## Acceptance Criteria

- [x] Candidates get a duplicate classification with a reason.
- [x] Likely duplicates are not selected by default.
- [x] Manual review and selection remain possible.

## Verified State

Built as planned, with no backend change.

- **Rules** (`features/duplicates/duplicates.utils.test.ts`, 13 tests):
  URL normalization ignores scheme, `www.`, trailing slash, fragment,
  and `utm_*`, but keeps other query parameters such as a job id; same
  URL and same company and role are likely duplicates across case and
  legal suffixes; a similar role at the same company and the same role
  and location elsewhere are possible duplicates; the strongest match
  wins; empty values never match. `e` and `v` were dropped from the
  legal-suffix list during review, since they would strip real
  single-letter name parts.
- **Section**: each candidate shows its classification and reason;
  likely duplicates start unselected and new or possible ones selected;
  a likely duplicate can still be checked; "Select new and possible"
  restores the default and "Clear selection" empties it; while jobs load
  or after they fail, nothing is preselected.
- **`npm run frontend:verify`**: 827 tests.
- **Dev server** (port 5173) against the real local jobs: a candidate
  "Senior Frontend Engineer at Celonis" showed "Likely duplicate: same
  company and role as Senior Frontend Engineer at Celonis" and started
  unselected; the two seeded candidates showed "New" and started
  selected ("2 of 3 selected").

Follow-up for task 049: re-check duplicates on the server with the same
rules when importing, rather than trusting the browser's answer (D1).

\r\n
