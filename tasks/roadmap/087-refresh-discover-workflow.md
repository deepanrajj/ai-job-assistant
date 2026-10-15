# Task 087 - Refresh Discover Workflow

Status: Completed

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype groups saved searches, candidate intake, and import
review into a clear Discover workspace. The existing frontend already
implements those workflows behind saved-search and import-candidate
feature flags, with duplicate detection and request feedback.

## Goal

Make the current Discover workflow visually coherent with the selected
design while preserving the full manual review and import behavior.

## Scope

In scope:

- Restyle the Discover page, saved-search list/editor, candidate intake,
  review list, duplicate indicators, selection, and import confirmation.
- Keep status, error, loading, and empty feedback close to the action
  that produced it.
- Style both enabled development views and the production fallback.

Out of scope:

- Automatic job-board fetching, new-match counts, browser extensions,
  AI discovery, new source mappings, or import API changes.
- Removing or enabling the feature flags before backend completion.

## Pre-Execution

1. Inspect `DiscoverPage`, `SavedSearchEditor`,
   `ImportCandidatesSection`, their route module, and related tests.
2. List every current action and error path so restyling does not hide
   selection, duplicate warnings, or per-candidate outcomes.

## Required Changes

1. Use task 084's shared cards, fields, badges, and buttons to form the
   prototype's saved-search, intake, and review hierarchy.
2. Keep existing hooks, validation, confirmation, refresh, and disabled
   states intact.
3. Check both feature-enabled and fallback routes at desktop and mobile
   widths, including long titles and URLs.

## Data And Contracts

No API, candidate mapping, local storage, or feature-flag changes.

## Tests

- Saved-search and candidate controls remain reachable and operable.
- Duplicate warnings, selection, import confirmation, partial results,
  and request failures retain visible feedback.
- Production fallback remains available when flags are off.

## Validation

Run affected Discover Vitest files, then `npm run frontend:verify`.
Visually inspect enabled and disabled states. Report focused local
checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [x] Discover follows the approved layout and palette.
- [x] Existing review/import behavior and failure feedback remain clear.
- [x] Flagged and fallback variants remain correct.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests and frontend verification pass.

## Commit

```text
task-087: refresh discover workflow
```
