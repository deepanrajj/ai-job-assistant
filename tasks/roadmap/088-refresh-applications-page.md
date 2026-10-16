# Task 088 - Refresh Applications Page

Status: Completed

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype shows a concise application-material overview. The
existing Applications page groups application-document metadata by job
and is behind the documents feature flag while task 041's backend work
is pending.

## Goal

Present real application-document metadata in the approved visual
system, with an understandable fallback when the feature is disabled.

## Scope

In scope:

- Restyle the Applications page heading, grouped document cards or
  table, status/date information, and job links.
- Preserve the current document types, version labels, links, and
  submitted dates rather than copying prototype rows.
- Style loading, error/retry, empty, and production fallback states.

Out of scope:

- File uploads, document content storage, immutable snapshots, or new
  draft/submission states not present in the current model.
- Backend work from tasks 041 or 082 and changes to the documents flag.

## Pre-Execution

1. Inspect `ApplicationsPage`, its route module, document types,
   grouping utility, and tests.
2. Map each prototype label to an actual document field or remove it.

## Required Changes

1. Apply the task 084 palette and shared components to the current
   document overview.
2. Keep document links, external-link semantics, job navigation, and
   submission metadata usable on desktop and mobile.
3. Preserve the feature-disabled route and independent error/empty
   presentation.

## Scope Notes

Agreed with the owner during the work and recorded in the plan
([D3 and D3a](../../docs/business/088-refresh-applications-page-plan.md)):

- A switchable matrix of jobs by document type and a card grid, with a
  stats bar above, as the grouped overview.
- Search, an "unsent only" filter, and paging for long lists, reusing
  the Jobs page's data table pieces.
- Because those pieces are shared, the filter reset in `useDataTable`
  (`filterKey`) also fixes the Jobs page's status filter, which kept a
  stale page; the stats bar became the shared `StatsBar`, used by both
  pages; and the document types now come from one ordered
  `DOCUMENT_TYPES` list, also used by the job detail type select.

## Data And Contracts

No API, document schema, storage, or feature-flag changes.

## Tests

- Grouped documents render with accurate labels, dates, and links.
- Empty, loading, error/retry, and disabled states remain visible.
- Long titles and URLs do not break the narrow layout. Checked in the
  running app at 1040 px and 390 px with long text injected, not by a
  unit test: jsdom has no layout, so a test could only assert class names.

## Validation

Run affected Applications Vitest files, then
`npm run frontend:verify`. Visually inspect populated and fallback
states. Report focused local checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [x] Applications uses the approved design with real metadata.
- [x] Existing links and document grouping still work.
- [x] Flagged, empty, loading, and error states remain clear.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests and frontend verification pass.

## Commit

```text
task-088: refresh applications page
```
