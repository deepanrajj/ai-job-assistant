# Task 081 - Expand Browser Journey Coverage

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- Task 080 proves the harness with one journey. That is enough to trust
  the setup and not enough to be a safety net.
- The journeys worth adding are the ones where a break would not be
  caught anywhere else: data crossing the frontend, the API, and the
  database, and surviving a reload.

Each journey below is blocked by the task that connects its screen to
the backend. Add each one when its dependency lands rather than waiting
for all of them.

Related docs:

- `../../docs/business/e2e-testing-strategy-plan.md` (work unit F)
- `../../tasks/roadmap/080-add-playwright-harness-and-first-journey.md`

## Goal

After this task:

- The main tracker flows are covered by browser journeys.
- The suite is stable enough to become a required check.
- Every journey earns its place; none duplicates a component test.

## Scope

In scope, each gated on its dependency:

| Journey | Depends on |
| --- | --- |
| edit a job, reload, the change persisted | 027 |
| delete a job, reload, it is still gone | 028 |
| open a job's detail page, its data loads from the API | 029 |
| add a task to a job, complete it, reload, status held | 030 |
| add a note to a job, reload, it is still there | 031 |

Out of scope:

- Field-level validation messages, translation strings, loading
  skeletons, and error states. All are component-test territory and are
  already covered there. A browser test that re-asserts a validation
  message costs thirty seconds to buy nothing.
- The dashboard, unless a break there would not surface in the jobs
  list journey.
- The AI tab. It calls a paid external provider; keep it out of the
  browser suite.
- Browsers beyond Chromium, unless a real cross-browser defect is
  found.
- Visual regression and accessibility snapshots.

## Pre-Execution

Before changing files:

1. Confirm which dependencies have landed. Write only those journeys.
2. Re-read the test-data strategy recorded in task 080 and follow it.
   A second journey is where a shared-database strategy starts to hurt.
3. For each proposed journey, state what breaks in production that no
   existing test would catch. If there is no answer, do not write it.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Steps:

1. Add each journey as its own spec file, named for the flow.
2. Keep every journey independent. No spec may depend on rows another
   spec created, or on execution order.
3. Query by role, label, and text. No `data-testid`.
4. End every persistence journey with a reload and an assertion after
   it.
5. Once the suite has been green across a meaningful run of pull
   requests, make the CI job a required check, and say in the pull
   request how many runs that judgement rests on.

## Data And Contracts

No production contract changes. If a journey cannot be expressed
without one, that is a signal about the UI's accessibility, and it gets
its own task rather than a `data-testid` here.

## Tests

The journeys are the tests. For each:

- Perform the user action through the UI.
- Reload.
- Assert the outcome survived.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Do not add sleeps.
- A journey that goes flaky is fixed or deleted, never retried into
  passing. A required check that people learn to re-run is worse than
  no check.

## Validation

```bash
npm run verify
```

Plus the E2E suite against a started stack, and the CI job.

## Acceptance Criteria

- [ ] Every journey whose dependency has landed is covered.
- [ ] Each journey ends with a reload and a post-reload assertion.
- [ ] Journeys are independent and can run in any order.
- [ ] No journey duplicates coverage that a component test already
      provides.
- [ ] No `data-testid` was added.
- [ ] The suite has been stable long enough to justify becoming a
      required check, and the pull request says how long.
- [ ] No unrelated files are changed.

## Commit

```text
task-081: expand browser journey coverage
```
