# Task 086 - Refresh Jobs List And Board

Status: Completed

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype shows a search/filter row, summary cards, and an
applications table. The current Jobs page already has a DataTable,
search, status filter, sorting, actions, and a Kanban view.

## Goal

Make both Jobs views match the approved visual system without changing
what they search, filter, sort, or save.

## Scope

In scope:

- Restyle the Jobs heading, toolbar, result summary, table, mobile rows,
  and list/board switch.
- Bring Kanban columns and job cards into the same palette and spacing.
- Use the existing `WISHLIST`, `APPLIED`, `INTERVIEW`, `OFFER`,
  `REJECTED`, and `WITHDRAWN` statuses and the existing source data.
- Added at the owner's request after the first pass, from a reference
  image: status count cards above the toolbar, a "Sort by" select over
  the existing sorts, one card holding the table and view switch, a
  "Date applied" column from the existing status history, a clickable
  status pill on each board card that moves the job to another status
  with the existing job update request, and the shared search and sort on the board. See D6-D12 in the
  plan.

Out of scope:

- New search fields, backend filters, statuses, or job attributes.
- Replacing the reusable DataTable solely to match the mock's pixels.
- Job detail and forms, which task 091 owns.

## Pre-Execution

1. Inspect `JobsPage`, `JobsKanbanBoard`, `DataTable`, job configuration,
   and their tests.
2. Confirm current search/filter semantics, sorting, and responsive
   behavior before changing presentation.

## Required Changes

1. Style the existing list controls and result presentation with shared
   primitives from task 084.
2. Style the Kanban view and maintain all status columns and actions.
3. Preserve loading, error/retry, empty, and no-filter-match states.
4. Avoid a second Add Job action where the global action is already
   visible; keep it reachable on mobile.

## Data And Contracts

No API, job schema, or persistence changes.

## Tests

- List and board toggles retain the displayed job set and actions.
- Search, status filter, and sort still produce the expected visible
  rows; empty results are explained.
- Mobile presentation and keyboard navigation keep the same controls.

## Validation

Run affected Jobs/DataTable/Kanban Vitest files, then
`npm run frontend:verify`. Visually inspect desktop and narrow widths.
Report focused local checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [x] Jobs list and board use the approved visual system.
- [x] Existing search, filters, sorting, status coverage, and actions
      retain their behavior.
- [x] Loading, error, and empty states remain useful.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests and frontend verification pass.

Local verification: `npm run frontend:verify` passed 992 tests, lint,
format check, coverage, and build. The board's page overflow fix was
measured in the running app.

## Commit

```text
task-086: refresh jobs list and board
```
