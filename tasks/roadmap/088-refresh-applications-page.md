# Task 088 - Refresh Applications Page

Status: Not started

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

## Data And Contracts

No API, document schema, storage, or feature-flag changes.

## Tests

- Grouped documents render with accurate labels, dates, and links.
- Empty, loading, error/retry, and disabled states remain visible.
- Long titles and URLs do not break the narrow layout.

## Validation

Run affected Applications Vitest files, then
`npm run frontend:verify`. Visually inspect populated and fallback
states. Report focused local checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [ ] Applications uses the approved design with real metadata.
- [ ] Existing links and document grouping still work.
- [ ] Flagged, empty, loading, and error states remain clear.
- [ ] Desktop and mobile layouts are accessible.
- [ ] Focused tests and frontend verification pass.

## Commit

```text
task-088: refresh applications page
```
