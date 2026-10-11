# Task 050 - Add Manual Duplicate Warning Plan

Status: Completed

## Purpose

Tell users, while they add or edit a job by hand, that a similar job is
already saved, naming it and why it matches, without stopping them from
saving: some repeats are real (a re-posted role, a second application
after a rejection).

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/050-add-manual-duplicate-warning.md`
- `docs/business/048-add-import-duplicate-detection-plan.md`

## Current State

Read on `feat/task-049-add-bulk-import-selected-jobs` at `dc36910`
(stacked on PR #67).

- `NewJobPage` and `EditJobForm` render the shared `JobForm` with React
  Hook Form; neither loads the saved jobs.
- 048 added `classifyDuplicate(input, jobs)` in
  `features/duplicates/duplicates.utils.ts`, which returns only the
  strongest match, and reason labels under `duplicates.reason`.
- `useJobsList` loads `GET /api/jobs`, which exists.
- `Alert` has `error`, `info`, and `success` variants; the theme already
  defines `warning` colours, used by 048's possible-duplicate text.

## Decisions

### D1 - The same rules as import, all matches listed

The form checks company, role, location, and job URL against the saved
jobs with 048's rules. A new `findDuplicates(input, jobs)` returns every
match, likely ones first and saved order among equals, and
`classifyDuplicate` becomes its first entry, so there is one rule set
and 048's tests keep covering it. The task asks for "matching jobs", and
a company with two similar saved roles should show both.

Rejected:

- **Only the strongest match.** Hides the second job the user may be
  confusing this one with.
- **A second, looser rule set for typing.** Two definitions of a
  duplicate that disagree between Discover and the job form.

### D2 - Warn, never block

A warning above the form's buttons, updated as the user types. Saving
works exactly as before, with no extra confirmation: the warning is the
override, since there is nothing to override. A confirmation step was
rejected as friction on every legitimate repeat, which the task rules
out ("without blocking creation").

The warning is a polite live region (`role="status"`), so a screen
reader hears it when a match appears without interrupting typing.

### D3 - Editing excludes the job itself

On edit, the job being edited is left out of the comparison; otherwise
every unchanged job would match itself by link or by company and role.

### D4 - Silent while loading or when the jobs cannot load

The check is advice. While the jobs load, or if they fail, the form
shows no warning and no error: the form's own purpose is unaffected,
and an error about a side check would read as a problem with saving.

### D5 - Matches open in a new tab

Each match links to its job's detail page in a new tab, labelled as
such, so looking at it does not discard what was typed. The pages load
the jobs with `useJobsList` and pass the warning to `JobForm` as a slot,
next to its existing `error` slot.

### D6 - A warning variant for `Alert`

`Alert` gains a `warning` variant from the existing theme colours. The
info variant was rejected: a duplicate is a caution, and 048 already
shows possible duplicates in the warning colour.

## Proposed Change

| File | Change |
| --- | --- |
| `features/duplicates/duplicates.utils.ts` | `findDuplicates`; `classifyDuplicate` from it |
| `features/jobs/components/JobDuplicateWarning.tsx` | the watched-fields check and warning |
| `features/jobs/components/JobForm.tsx` | a `duplicateWarning` slot above the buttons |
| `pages/jobs/NewJobPage.tsx`, `EditJobForm.tsx` | load jobs, render the warning |
| `components/ui/*` | `warning` alert variant |
| `i18n/locales/en.json`, `de.json` | warning text |
| page tests | a `GET /api/jobs` handler, now that the pages load jobs |

## Tests

A warning with the matching jobs and reasons appears when a similar job
is saved; no warning without a match, while loading, or when the jobs
fail to load; the job being edited never matches itself; saving goes
through with the warning shown; `findDuplicates` returns every match in
order.

## Implementation Order

Utility and its tests, alert variant, warning component and its tests,
form slot, pages and their tests, translations;
`npm run frontend:verify`; dev server check against the real jobs.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, and adding and editing
a job in the dev server against the running backend.

## Scope Boundaries

Out of scope: preventing duplicates, AI scoring, server-side checks, and
import behaviour (task 048).

## Completion Rules

Frontend only; complete once verified.

## Acceptance Criteria

- [x] Manual create/edit warns on duplicates.
- [x] Users can override the warning.
- [x] Duplicate logic is shared with import where practical.

## Verified State

Built as planned, with no backend change and no flag: it uses the
existing `GET /api/jobs`.

- **Rules** (`duplicates.utils.test.ts`): `findDuplicates` returns every
  match, likely first and saved order among equals, and nothing without
  a match; 048's `classifyDuplicate` tests pass unchanged on top of it.
- **Warning** (`JobDuplicateWarning.test.tsx`): lists every similar job
  with its reason, linked to its detail page in a new tab; matches by
  link across `www.` and trailing slash; nothing without a match, while
  loading, or after a load failure; the job being edited never matches
  itself.
- **Pages**: adding a job with a likely duplicate shows the warning and
  still creates the job; editing shows another similar job, not the job
  itself, and still saves. The page and route tests now declare
  `GET /api/jobs`, which the form loads; without it they passed only
  because they ended before the request resolved.
- **`npm run frontend:verify`**: 856 tests.
- **Dev server** (port 5173) against the real local jobs, in German:
  adding "Frontend Engineer" at "Celonis SE" warned "Senior Frontend
  Engineer bei Celonis (mögliches Duplikat: ähnliche Rolle beim gleichen
  Unternehmen)", linked to that job's id, with the create button
  enabled; editing the Celonis job showed no warning until the company
  was changed to Personio, which then named the Personio job. Nothing
  was saved.
