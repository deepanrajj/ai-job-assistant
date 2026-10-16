# Task 091 - Refresh Job Detail Page

Status: Not started

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The selected prototype covers the main navigation pages, while the
existing Job Detail route is a central part of the same product. Its
overview, tasks, notes, timeline, AI, contacts, reminders, and documents
need a coherent visual treatment without changing their workflow rules.

## Goal

Make the Job Detail page and its visible tabs feel like the redesigned
app while preserving current data and actions.

## Scope

In scope:

- Refresh the job header, status/source display, tabs, overview cards,
  and tab content surfaces using task 084's shared design system.
- Keep the existing task, note, timeline, AI, contact, reminder, and
  document controls and their feature flags.
- Style loading, missing-job, error/retry, and empty tab states.

Out of scope:

- New tabs, AI actions, document uploads, data fields, API contracts,
  or feature-flag changes.
- Job create/edit forms, which task 092 owns.

## Pre-Execution

1. Inspect `JobDetailPage`, its child components, route module, feature
   flags, and focused tests.
2. Inventory the available tab states and actions before changing layout.

## Required Changes

1. Apply existing shared cards, buttons, badges, and type hierarchy to
   the job header and tab surfaces.
2. Preserve tab order, routing, status changes, form actions, and
   per-tab error feedback.
3. Ensure long descriptions, URLs, notes, and document names remain
   readable on desktop and mobile.
4. Apply the button variants in `../../frontend/AGENTS.md` §3 "Button variants". Found
   in task 088's audit: Edit in the contacts, documents, and reminders
   panels is `primary` (should be `ghost`), and Delete in the contacts,
   documents, notes, reminders, and tasks panels is solid `danger`
   (should be `dangerGhost` unless it is the final confirmation).

## Data And Contracts

No API, storage, AI request, or feature-flag changes.

## Tests

- Existing tab navigation and primary actions remain reachable.
- Job status and source render from real model values.
- Missing, loading, error, empty, and flagged tab states retain feedback.

## Validation

Run affected Job Detail and tab Vitest files, then
`npm run frontend:verify`. Visually inspect representative populated
and empty tabs at desktop and mobile widths. Report focused local
checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [ ] Job Detail matches the approved visual system.
- [ ] Every existing tab and action retains its behavior.
- [ ] Flagged, error, and empty states remain clear.
- [ ] Desktop and mobile layouts are accessible.
- [ ] Focused tests and frontend verification pass.

## Commit

```text
task-091: refresh job detail page
```
