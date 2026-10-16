# Task 092 - Refresh Job Forms And Review Design

Status: Not started

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Tasks 084-091](../../docs/business/084-frontend-visual-refresh-plan.md#task-mapping-and-order).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The create/edit routes share a job form and must fit the new visual
system. The preceding tasks will have refreshed the shell, six main
pages, and Job Detail. This final task also checks their visual
consistency without reopening their product scope.

## Goal

The job create/edit flow fits the approved design, and the redesigned
route set is visually consistent at desktop and mobile sizes.

## Scope

In scope:

- Restyle `NewJobPage`, `EditJobPage`, the shared job form, field groups,
  actions, validation, and the manual duplicate warning.
- Complete a final visual review of the routes refreshed by tasks
  084-091, fixing only clear design inconsistencies introduced by the
  refresh.
- Record any separate product or behavior issue as a follow-up instead
  of expanding this task.

Out of scope:

- New job fields, validation rules, duplicate logic, API changes, or
  unrelated form refactors.
- New global test infrastructure or a full local E2E suite run.

## Pre-Execution

1. Inspect create/edit pages, `JobForm`, duplicate warning, shared form
   fields, and their tests.
2. Compare all refreshed routes with the plan and HTML reference,
   including language switching and feature-disabled states.

## Required Changes

1. Apply task 084's shared type, color, spacing, field, alert, and
   button treatments to the create/edit flow.
2. Keep validation, save errors, duplicate warnings, cancel/navigation,
   and loading behavior visible and keyboard accessible.
3. Perform a focused desktop/mobile visual pass across Dashboard, Jobs,
   Discover, Applications, Calendar, Profile, Job Detail, and forms.
   Correct only styling gaps from this refresh.
4. Summarize the finished design and remaining limitations for task 071
   README screenshots.
5. Apply the button variants in `../../frontend/AGENTS.md` §3 "Button variants". Found
   in task 088's audit: `JobForm`'s Cancel is `secondary` (should be
   `ghost`, as every other Cancel). In the visual pass, check that every
   page follows the table.

## Data And Contracts

No API, persistence, status, duplicate-matching, or feature-flag
changes.

## Tests

- Create and edit submit, validation, duplicate warning, and failure
  feedback remain intact.
- Focus order and visible labels work for all form controls.
- Refreshed routes have no obvious overflow or hidden primary actions
  at narrow widths.

## Validation

Run affected job-form Vitest files, then `npm run frontend:verify`.
Perform the focused visual route pass with mock/dev data; do not run the
full local E2E suite. In the PR description distinguish local checks
from the full CI E2E suite and update its actual result when CI finishes.

## Acceptance Criteria

- [ ] Create/edit forms match the approved design.
- [ ] Existing form, duplicate warning, and failure behavior remains.
- [ ] The refreshed route set is visually coherent and mobile readable.
- [ ] Accessibility and focused tests pass.
- [ ] Frontend verification passes; CI status is reported accurately.

## Commit

```text
task-092: refresh job forms and review design
```
