# Task 080 - Add Playwright Harness And First Journey Plan

Status: In progress - verified locally, CI run pending

## Purpose

Prove, for the first time, that the frontend and backend talk to each
other. Every existing suite stubs the other side: Vitest uses MSW, the
backend tests never render a page. One browser journey - create a job
through the form, see it listed, reload, still see it - is the
assertion neither suite can make, because only a reload proves the row
reached PostgreSQL rather than React state.

This task adds no application code. It adds a Playwright package in a
top-level `e2e/` directory, one spec, an npm script, a non-gating CI
workflow, and the documentation for them.

## Authoritative References

- `AGENTS.md`
- `docs/context.md`
- `frontend/AGENTS.md` (section 6, accessible queries)
- `docs/business/e2e-testing-strategy-plan.md` (D3, D4, D4a, work
  unit E)
- `docs/engineering/github-pipeline.md`
- `tasks/roadmap/080-add-playwright-harness-and-first-journey.md`

## Current State

Read on `main` at `eb42579`.

- **Dependencies are met.** 026 (add-job form writes through
  `POST /api/jobs`), 069 (compose stack), 020/023/024 (service, models,
  jobs list from the API) are all complete.
- **The form.** `/jobs/new` renders labels `Company` and `Role` and a
  `Create job` submit button. On success `NewJobPage` navigates to
  `/jobs` (`NewJobPage.tsx`), not to the new job.
- **The list paginates at 5 rows.** `DEFAULT_PAGE_SIZE_OPTIONS` is
  `[5, 10, 25]` in `components/dataTable/dataTable.constants.ts`, and
  nothing sorts new jobs first. On any database with more than a
  handful of jobs, a freshly created job is usually not on page one
  (D3).
- **The list has a search box** labelled `Search`, filtering company,
  role, and location in the browser.
- **Required checks.** The `Protect main` ruleset requires exactly
  `Frontend Verify`, `Backend Verify`, and `Docker Build` (read with
  `gh api repos/.../rulesets/18203193`). A job with any other name is
  reported but does not gate a merge (D5).
- **Tooling scope.** `lint-staged` and Prettier only cover
  `frontend/**`; the root package has no formatter or TypeScript.
- **CI.** `Docker Build` already builds the images and brings the
  compose stack up with `--wait`, then runs the smoke check and Newman.

## Decisions

### D1 - Playwright lives in its own package, `e2e/`

Chosen: `e2e/package.json` with its own lockfile, holding only
`@playwright/test`, and root scripts that call it with `--prefix e2e`,
the same way root scripts reach `frontend/`.

Rejected:

- **A root `devDependency`.** Every CI job runs `npm ci` at the root,
  so `Frontend Verify` and `Backend Verify` would install Playwright
  for nothing.
- **Under `frontend/`.** The task forbids it: Vitest would collect
  `*.spec.ts` and the files would fall under frontend coverage (D4 in
  the strategy plan).

### D2 - `baseURL` from `E2E_BASE_URL`, then `E2E_ENV`, then `cluster`

Exactly D4a: `dev` is `http://localhost:5173`, `cluster` is
`http://localhost:30080`, and an unknown `E2E_ENV` fails fast with the
list of valid names instead of silently falling back. Compose publishes
30080 too, so CI needs no variable. Specs use relative paths only.

### D3 - Test data: unique names, found through the search box, deleted after

Each test names its job `E2E <run id>` with a random suffix, so parallel
tests and repeated runs never see each other's rows, and asserts only
on that name.

The journey finds its row by typing that name into `Search` rather
than scanning page one. That is the only reliable way given the 5-row
page (Current State), and it is how a user finds a job too.

After each test an `afterEach` hook deletes every job with that company
through the API (`GET /api/jobs`, then `DELETE /api/jobs/{id}`), so a
local cluster database does not fill with test rows. CI throws its
database away with `compose down -v` anyway.

Rejected:

- **Resetting the database** before a run. On the `cluster` target it
  would wipe the developer's own jobs.
- **A test-only reset endpoint.** A production code change, which the
  task rules out.
- **No cleanup.** Every local run would leave a row behind.
- **Raising the page size or sorting in the test.** Clicking controls
  unrelated to the journey makes it fail for reasons unrelated to it.

### D4 - A global setup refuses non-local targets

D4a asks for the guard "once a non-local URL exists"; the suite writes
and deletes real rows, and `E2E_BASE_URL` can already point anywhere,
so it is added now. `global-setup.ts` allows `localhost`, `127.0.0.1`,
and `[::1]`, plus any host listed in `E2E_ALLOWED_HOSTS`
(comma-separated), and otherwise throws before any test runs.

Rejected: a check inside the spec. The next spec would have to
remember to repeat it.

### D5 - CI: a separate workflow whose job is not a required check

Chosen: `.github/workflows/e2e.yml` with one job, `Browser E2E`: build
images, start compose with `--wait`, install Chromium, run the suite,
upload `e2e/test-results` (traces) and the HTML report **on failure**,
print compose logs on failure, and always tear down.

It does not gate merges because its name is not in the ruleset's
required checks. Making it required later is a ruleset change, not a
code change.

Rejected:

- **Steps inside the `Docker Build` job.** That job is required, so a
  flaky browser test would block merges, which the task forbids.
  `continue-on-error` on the step would avoid that, but would also turn
  a failure green on the PR's check list, hiding it.
- **`continue-on-error` on the new job.** Not needed: the job already
  cannot block, and leaving it red keeps failures visible.

The cost is a second image build per PR, a few minutes of runner time,
accepted for the isolation.

### D6 - Retries, traces, and one project, as the task specifies

`retries: 2` when `CI` is set, else `0`; `trace: 'on-first-retry'`;
one Chromium project; `forbidOnly` in CI so a stray `test.only` fails
the run. No `webServer` block: the suite targets a stack that is
already running (compose in CI, cluster or `dev` locally), and starting
one would bypass the target switch.

### D7 - No lint or type-check gate for `e2e/` yet

Playwright runs TypeScript itself without type-checking it. Adding
`typescript`, ESLint, and Prettier configs to `e2e/` would be three
more dependencies for two files. The files are formatted once with the
frontend's Prettier settings by hand. A `tsconfig.json` is added only
so editors resolve the Playwright types, with `@types/node` beside
Playwright because the config reads `process.env`; a one-off
`tsc -p e2e/tsconfig.json` with the frontend's compiler passed
(verified), but nothing runs it automatically.

Rejected: extending `lint-staged` to `e2e/`. It runs the frontend's
tool binaries with `frontend/` as the working directory, so it would
need its own path handling; worth doing with task 081 when the suite
grows.

## Proposed Change

| File | Change |
| --- | --- |
| `e2e/package.json`, `e2e/package-lock.json` | `@playwright/test` and `@types/node`, pinned; `test`, `install:browsers`, `report` scripts |
| `e2e/playwright.config.ts` | D2 target resolution, D6 settings, global setup |
| `e2e/global-setup.ts` | D4 host guard |
| `e2e/tsconfig.json` | editor type resolution only |
| `e2e/tests/add-job.spec.ts` | the journey and its cleanup |
| `e2e/README.md` | how to run, targets, data strategy, the guard |
| `package.json` | `e2e:install`, `e2e:test` |
| `.gitignore` | `e2e/test-results/`, `e2e/playwright-report/` |
| `.github/workflows/e2e.yml` | D5 |
| `docs/engineering/github-pipeline.md` | the new workflow, and that it is not required |

## Tests

The journey is the test:

1. Open `/jobs/new`, fill `Company` and `Role`, submit `Create job`.
2. On `/jobs`, search for the company; its row is visible.
3. Reload. Search again; the row is still visible.

Plus two one-off demonstrations recorded in the verified-state section,
not committed as tests:

- With the backend stopped, the journey fails.
- `npm run frontend:test:coverage` reports the same test count and
  coverage before and after, proving Vitest does not collect `e2e/`.

## Implementation Order

1. **Package and config.** `npx playwright test --list` with no specs.
   Expected: "No tests found", which proves config and target
   resolution load.
2. **Guard.** Run with `E2E_BASE_URL=https://example.com`. Expected:
   global setup throws before any test.
3. **Spec**, against a running stack. Expected first failure if the
   search step is skipped: the row is missing on page one once the
   database has more than five jobs.
4. **Backend-stopped run.** Expected: create fails, the journey fails.
5. **Scripts, ignore rules, README, workflow, pipeline doc.**
6. **CI run on the PR.** Expected: `Browser E2E` reported, not required.

## Verification Plan

Per `AGENTS.md` section 3:

- `package.json` script change: run `npm run e2e:install` and
  `npm run e2e:test` themselves, on this platform.
- The journey against the compose stack (`npm run dev:compose`), which
  is what CI uses.
- `npm run verify`, to show nothing outside `e2e/` regressed and that
  the frontend test count is unchanged.
- The workflow, by its run on the pull request.

## Scope Boundaries

Out of scope: any other journey (task 081), browsers beyond Chromium,
visual or accessibility snapshots, making `Browser E2E` required, a
reset endpoint or any production code change, `cross-env`, and lint or
type-check tooling for `e2e/` (D7).

## Completion Rules

Tick the task file's criteria only once each is demonstrated. Then
update `docs/backlog/phase-8-portfolio-polish.md`, the strategy plan's
progress table (unit E), and mark this plan `Completed` with a
verified-state section.

## Acceptance Criteria

- [x] One journey passes against the local stack.
- [x] It fails with the backend stopped, demonstrated once.
- [x] Specs live in `e2e/` and Vitest's test count is unchanged.
- [x] `baseURL` comes from configuration; no host appears in a spec.
- [x] The test-data strategy and the host guard are documented.
- [ ] Traces upload on CI failure, and `Browser E2E` does not gate.

## Verified State

Verified locally on 2026-10-04, on Windows with Docker Desktop, against
`npm run dev:compose` built from this branch:

- **Journey passes.** `npm run e2e:test`: 1 passed in about 3 seconds.
  Afterwards `GET /api/jobs` returned the 3 pre-existing jobs and no
  `E2E ` rows, so the API cleanup works.
- **Fails without the backend.** With `smart-job-tracker-backend`
  stopped, the journey failed at `toHaveURL(/\/jobs$/)`: the create
  request failed, so the form stayed on `/jobs/new`. The `afterEach`
  cleanup then timed out at the 30-second test timeout, because Nginx
  held `GET /api/jobs` open waiting for the upstream. That makes a
  backend-down failure slow (and three attempts in CI), not wrong; left
  as it is. Restarting the backend made the journey pass again.
- **Guard and targets.** `E2E_BASE_URL=https://example.com` was
  refused by the global setup before any test ran;
  `E2E_ENV=staging` failed with the list of valid targets.
- **Vitest unaffected.** No file under `frontend/` changed, and
  `npm run verify` reported the same 512 frontend tests and coverage
  as `main`, plus a green backend verification.
- **Scripts on this platform.** `npm run e2e:install` and
  `npm run e2e:test` both ran from the repository root under Windows.
- **Types.** `tsc -p e2e/tsconfig.json` with the frontend's compiler
  passed once (D7).

The expected failure in implementation step 3 (the row missing from
page one without the search) did not occur here: the compose database
held only 3 jobs, so the new row fit on page one. The search step stays,
because the cluster database it also targets is larger.

Still open, needing the pull request's CI run: `Browser E2E` passes on
the runner, uploads traces on a failure, and is reported without being
required.
