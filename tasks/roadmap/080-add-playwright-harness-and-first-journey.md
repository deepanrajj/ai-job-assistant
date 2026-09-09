# Task 080 - Add Playwright Harness And First Journey

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- No test has ever proven the frontend and backend can talk to each
  other. Both suites stub the other side.
- Component tests cannot assert that data survived a page reload, which
  is the only assertion that proves data reached the database.

**Do not start this before task 026.** Until the add-job form and the
jobs list read and write through the API, the only journey available is
the UI against `localStorage`, which the React Testing Library suite
already covers in milliseconds. Building it early means writing a test
that proves nothing and rewriting it when 026 lands.

Depends on tasks 069, 026, and the `jobService`, typed models, and jobs
list work in 020, 023, and 024.

Related docs:

- `../../docs/business/e2e-testing-strategy-plan.md` (decisions D3,
  D4, D4a, work unit E)

## Goal

After this task:

- Playwright is installed and configured, with one journey passing.
- The journey creates a job through the form, sees it in the list,
  reloads the page, and finds it still there.
- The suite targets an environment through configuration, not through
  hardcoded hosts.
- It runs in CI without gating merges yet.

## Scope

In scope:

- The Playwright dependency, configuration, and directory layout.
- Exactly one journey.
- A test-data strategy, chosen and written down.
- An npm script and a non-blocking CI job.

Out of scope:

- More journeys. Those are task 081. One journey proves the harness;
  five prove it five times before anyone knows the harness is right.
- Any production code change. If a journey cannot be written without a
  selector change, prefer an accessible name over a `data-testid`, per
  `frontend/AGENTS.md` section 6, and keep it minimal.
- Browsers beyond Chromium.
- Visual regression or accessibility snapshots.
- Making the job a required check. That is a later decision, after it
  has been stable across a run of pull requests.

## Pre-Execution

Before changing files:

1. Confirm 026 has landed and the form genuinely writes through the
   API. Create a job in the UI and check the row with
   `npm run db:psql`.
2. Choose the test-data strategy and record it. Decision D4a leans
   towards each test creating uniquely-named data and asserting only on
   its own rows, because there is no user scoping yet and a shared
   database otherwise makes parallel tests fight.
3. Confirm the accessible names the journey will query, from the
   existing component tests.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Steps:

1. Add `@playwright/test` and install the Chromium browser.
2. Put specs in a top-level `e2e/` directory, **not** under
   `frontend/`. Vitest scans from `frontend/` and its default include
   pattern would collect `*.spec.ts` files, so a spec under `frontend/`
   gets picked up by both runners and fails confusingly in both. A
   top-level directory also keeps E2E out of the frontend coverage
   scope, which is `src/**`.
3. Configure `baseURL` by resolution order: `E2E_BASE_URL`, then the
   named target in `E2E_ENV` (`dev` for `http://localhost:5173`,
   `cluster` for `http://localhost:30080`), then `cluster`.
4. Set `trace: 'on-first-retry'`, `retries: 2` in CI and `0` locally,
   and a single Chromium project.
5. Write the journey. Query by role, label, and text. No
   `data-testid`. Navigate with relative paths only.
6. Add an npm script, and a CI job that runs it against the compose
   stack and uploads traces on failure.
7. Document how to run it locally, including that targeting `dev`
   starts only the frontend and still needs a backend running.

## Data And Contracts

The suite writes real rows to a real database. Record in the E2E
README how those rows are isolated or cleaned up, and never point the
suite at anything that is not local without the guard described in
decision D4a.

## Tests

The journey is the test:

- Open the add-job form, fill company and role title, submit.
- The new job appears in the jobs list.
- **Reload the page.** The job is still listed.

The reload is the point. Without it the test proves only that React
state updated, which a component test already covers.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Do not add a sleep. Use Playwright's auto-waiting and web-first
  assertions; a fixed sleep is how a suite becomes slow and flaky at
  the same time.

## Validation

```bash
npm run verify
```

The E2E suite runs separately and is not part of `verify`. Run it
against a started stack, and confirm the CI job passes.

## Acceptance Criteria

- [ ] One journey passes against the local stack.
- [ ] It fails if the backend is stopped, demonstrated once. A journey
      that passes without a backend is testing `localStorage`.
- [ ] Specs live outside `frontend/` and are not collected by Vitest.
- [ ] Frontend coverage numbers are unchanged by this task.
- [ ] `baseURL` comes from configuration; no host appears in a spec.
- [ ] The test-data strategy is written down.
- [ ] Traces are uploaded on CI failure.
- [ ] The CI job does not gate merges yet.
- [ ] No unrelated files are changed.

## Commit

```text
task-080: add playwright harness and first journey
```
