# End-To-End Testing Strategy Plan

Status: Proposed

## Purpose

Decide what "end to end" should mean for Smart Job Tracker on the
backend and in the browser, what is worth building now, and what has to
wait for the frontend to actually talk to the backend.

This is a strategy note covering several tasks, not a single task plan.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/068-add-backend-integration-tests.md`
- `tasks/roadmap/069-add-docker-compose-for-full-local-stack.md`
- `docs/api/README.md`
- `.github/workflows/ci.yml`

## Current State

| Layer | Tool | What it proves | Runs in |
| --- | --- | --- | --- |
| Backend unit | JUnit 5, AssertJ | service, mapper, and DTO logic | `backend:verify` |
| Backend integration | `@SpringBootTest`, MockMvc, H2 in PostgreSQL mode, real Flyway | controller to service to repository to schema | `backend:verify` |
| Frontend component | Vitest, React Testing Library | user-visible component behaviour | `frontend:verify` |
| Live API by hand | Postman collection in `docs/api` | HTTP contract against a running stack | manual |
| Browser journeys | none | nothing | nowhere |

Three gaps, in descending order of how much they can hurt.

**Nothing runs against real PostgreSQL.** Every database-backed test
uses H2 in PostgreSQL mode, which is a compatibility approximation, not
PostgreSQL. `FlywayMigrationTest` therefore validates the migrations
against a database the product never runs on. The differences that bite
are timestamp-with-time-zone semantics against `OffsetDateTime`, `uuid`
storage and comparison, `numeric` precision for the salary columns,
foreign-key and cascade timing, and any PostgreSQL-only syntax a future
migration reaches for. A migration that H2 accepts and PostgreSQL
rejects passes CI and fails on deploy.

**Nothing exercises the frontend and backend together.** Both suites
stub the other side.

**No browser journeys exist.** Task 068 covers backend integration
tests and explicitly lists "end-to-end browser tests" as out of scope,
so nothing on the roadmap claims this ground.

## The Constraint That Shapes The Sequencing

The frontend does not persist jobs through the backend yet. `apiClient`
and `ai.service` exist, but job data lives in `localStorage` via
`JobsProvider` and `jobsStore.utils`. Tasks 023 to 035 replace that.

So a browser test asserting "create a job in the UI, see the row in
PostgreSQL" **cannot be written today**. What could be written today is
a browser test asserting the UI works against `localStorage`, which is
what the React Testing Library suite already proves, in milliseconds
instead of tens of seconds and without a browser to flake.

Building browser E2E before phase 4 buys duplicated coverage at roughly
a hundred times the cost per assertion, and the tests would need
rewriting the moment the store changes anyway.

**Backend-side E2E is worth starting now. Browser E2E waits for phase
4.**

## Blocker: The Backend CI Job Cannot Run Linux Containers

Every backend script in `package.json` hardcodes the Windows launcher:

```json
"backend:test": "cd backend && .\\gradlew.bat test"
```

`gradlew.bat` does not exist on Linux, so `npm run backend:verify` only
runs on Windows, which is why `.github/workflows/ci.yml` pins the
backend job to `windows-latest`.

GitHub's Windows runners provide Docker for Windows containers. The
PostgreSQL image Testcontainers needs is a Linux container, so
Testcontainers is expected not to work there. Confirm this against the
runner before committing to the fix rather than taking it on trust, but
plan for it: it makes cross-platform scripts a prerequisite for
anything involving real PostgreSQL in CI, not a tidy-up.

The fix is small - select the launcher by platform, or have CI invoke
`./gradlew` directly - and it unpins the backend job so it can move to
`ubuntu-latest`, which is also faster and cheaper.

## Decisions

### D1: "Backend E2E" and "UI E2E" are different projects

Treat them separately and sequence them. Backend-side work has no
dependency on phase 4; browser work is entirely blocked by it.

### D2: Testcontainers for real PostgreSQL, alongside H2 rather than
replacing it

Add a PostgreSQL Testcontainers setup and run the persistence-facing
tests against it.

Keep H2 for the fast inner loop. Making every `npm run backend:verify`
start a PostgreSQL container would put a Docker dependency and several
seconds of container startup on every commit, and the current suite is
fast enough to run constantly. That habit is worth protecting.

So: a separate Gradle task and source set - `integrationTest` - that
runs against real PostgreSQL, invoked in CI and on demand, while `test`
stays hermetic. The tests worth moving or duplicating there first are
`FlywayMigrationTest` and `JobCrudIntegrationTest`, because they are the
ones whose H2 result is least trustworthy.

This adds a dependency, which `AGENTS.md` section 0 says needs explicit
approval.

### D3: Playwright for the browser, not Cypress

Better CI story, real multi-browser support, first-class TypeScript,
auto-waiting that removes most sleep-based flake, a trace viewer that
makes CI failures diagnosable, and no account or hosted service. It also
runs its own runner, so it will not collide with Vitest.

Also a new dependency needing approval.

### D4: E2E stays out of `npm run verify` and out of the coverage gates

`verify` is the pre-push gate and must stay fast and hermetic. E2E gets
its own script and its own CI job.

Coverage matters more than it looks here. The backend gate demands 100
per cent line and branch coverage; if `integrationTest` output fed
JaCoCo, coverage would rise for reasons unrelated to unit-level quality
and the gate would quietly stop meaning anything. Same on the frontend,
where Vitest coverage is scoped to `src/**` - Playwright specs must live
outside `src/` so they are neither collected as unit tests nor counted.

### D4a: Browser E2E targets an environment, resolved from one variable

The suite runs against the local stack now and against other
environments as they appear, without spec changes.

Only two of the three local URLs can host browser E2E. `nginx` serves
the built app at `/` and proxies `/api/`, and the Vite dev server does
the same for `/api` to port 4000, so both are single-origin and need no
CORS handling. Port 4000 alone serves the API only and cannot drive UI
tests.

| Name | URL | Use |
| --- | --- | --- |
| `dev` | `http://localhost:5173` | Vite dev server; fastest feedback while writing specs |
| `cluster` | `http://localhost:30080` | local Kubernetes; production-like, the default |

Resolution order, in `playwright.config.ts`:

1. `E2E_BASE_URL`, if set - the escape hatch for CI, a compose stack, a
   pull-request preview, or a future staging host.
2. The named target in `E2E_ENV`.
3. `cluster`, the documented default runtime.

Specs navigate with relative paths only - `page.goto('/jobs')` - so
adding an environment is a configuration line rather than a change to
any test. A host hardcoded in a spec defeats the whole arrangement, and
is the one thing to reject in review.

Three consequences worth designing for now rather than retrofitting:

- **Committed configuration holds URLs and nothing else.** When
  authentication lands, test-user credentials come from environment
  variables and CI secrets.
- **Guard destructive specs by target.** The suite creates and deletes
  data. Once a non-local URL exists, a global setup that refuses to run
  unless `baseURL` is localhost or explicitly allow-listed costs a few
  lines and prevents an expensive mistake.
- **Specs stay environment-agnostic.** No `if (env === ...)` inside a
  test. Differences belong in configuration and fixtures; a spec that
  behaves differently per environment tests two things and proves
  neither.

Note for this machine: `E2E_ENV=dev npx playwright test` is POSIX
syntax and does not work in `cmd.exe`, the same defect as
`k8s:create-secret`. PowerShell needs `$env:E2E_ENV='dev'`. CI sets
environment variables natively, so this only affects ad-hoc local
switching. `cross-env` would remove the friction at the cost of a
dependency.

### D5: Docker Compose is the substrate for stack-level E2E

Task 069 already plans a compose stack. Standing up Kubernetes in CI to
run browser tests is disproportionate; `compose up`, run, `compose down`
is the normal shape.

That makes 069 a prerequisite for stack-level E2E rather than the
late-phase nicety its current position implies.

### D6: The Postman collection is already most of a backend E2E suite

`docs/api/smart-job-tracker.postman_collection.json` drives create,
list, read, update, delete, the 404 after delete, and a validation
failure, with assertions, against a live server. Running it with Newman
against the compose stack turns work that already exists into a CI gate
for roughly the cost of one workflow step.

This is the cheapest genuine E2E available and should come before
anything is written from scratch.

## Proposed Layers

```text
  browser journeys (Playwright, compose stack)     few, slow, after phase 4
  API E2E vs running stack (Newman, compose)       a handful
  integration vs real PostgreSQL (Testcontainers)  the DB-facing tests
  integration vs H2 (existing)                     fast inner loop
  unit (JUnit, Vitest + RTL)                       the bulk, exists
```

Each layer only earns its place by catching something the layer below
cannot. Browser tests that re-assert validation rules already covered by
component tests are cost without cover.

## Work Units

| # | Task | Work | Depends on |
| --- | --- | --- | --- |
| A | 077 | Make backend npm scripts cross-platform; move backend CI to `ubuntu-latest` | none |
| B | 078 | Testcontainers PostgreSQL and an `integrationTest` source set | A |
| C | 069 | Docker Compose for the full local stack (already on the roadmap) | none |
| D | 079 | Run the Postman collection with Newman against compose in CI | C |
| E | 080 | Playwright harness, config, and one journey | C, 026 |
| F | 081 | Journey coverage: edit, delete, detail, tasks, notes | E, and each journey's own task |

## Accelerated Ordering

The roadmap runs 010 to 019 before any frontend integration, which puts
the first browser journey seventeen tasks away. It does not have to be.

**The jobs API is already finished.** Tasks 004 to 007 shipped
`GET`, `POST`, `PUT` and `DELETE /api/jobs`, and they work against the
deployed stack. The four tasks needed for the first browser journey -
020 `jobService`, 023 typed API response models, 024 jobs list from the
API, and 026 the add-job form - depend on that API and nothing else.
Tasks 010 to 019 add the task, note, and timeline domains, none of
which the first journey touches.

So the first journey is four tasks away, not seventeen, if 020, 023,
024 and 026 are pulled ahead of 010.

The argument for doing that is not really about testing. **Nothing has
ever proven the frontend and backend can talk to each other.** Both
suites stub the other side. Tasks 010 to 019 would build three more
backend domains on top of an assumption nobody has checked. Connecting
jobs end to end first means finding a contract mistake once rather than
four times, and every domain after it inherits a proven pattern.

Suggested order:

| Order | Work | Why here |
| --- | --- | --- |
| 1 | 077 | tiny, unblocks CI work, no dependencies |
| 2 | 069 | the stack CI needs; already on the roadmap |
| 3 | 079 | the collection exists; nearly free end-to-end coverage |
| 4 | 078 | closes the H2-versus-PostgreSQL gap |
| 5 | 020, 023, 024, 026 | pulled forward; connects jobs end to end |
| 6 | 080 | first browser journey, now meaningful |
| 7 | 010 to 019 | the remaining backend domains, on a proven pattern |
| 8 | 081 | journeys added as 027 to 031 land |

Steps 1 to 4 can start today and deliver the pipeline without touching
feature work. Step 5 is the sequencing decision; the rest follows.

This reorders the roadmap and is therefore the user's call, not an
implementation detail. Nothing here changes what the tasks contain.

## Journeys Worth Covering In F

Keep this list short and defend every addition. A first cut:

- add a job through the form and see it in the list and on the dashboard
- edit a job and see the change persist across a reload
- delete a job and see it gone after a reload
- add a task to a job, complete it, and see the status survive a reload

The reload is the point in each one. It is the assertion a component
test cannot make, because it is what proves data reached the backend
rather than component state.

Explicitly not browser-tested: field-level validation messages,
translation strings, loading skeletons, and error states. Those are
component-test territory and are already covered there.

## Scope Boundaries

- E2E does not replace unit or component tests, and no existing test is
  deleted because an E2E now covers the same ground.
- No E2E calls the real OpenAI API. AI endpoints are faked at the
  provider boundary.
- Browser tests do not gate merges until they have been stable for a
  meaningful run of pull requests. A flaky required check trains people
  to ignore red.
- No visual-regression or accessibility-snapshot tooling in this plan.
  `eslint-plugin-jsx-a11y` and the existing role-and-label query rules
  already cover a lot; anything more is its own decision.
- No new libraries beyond Testcontainers and Playwright, and both need
  approval before work starts.

## Open Decisions

1. Approve Testcontainers and Playwright as dependencies, and decide
   whether `cross-env` is worth adding alongside them (see D4a).
2. Confirm D2: real PostgreSQL in a separate `integrationTest` task
   rather than replacing H2 everywhere.
3. Confirm the accelerated ordering, in particular pulling 020, 023,
   024 and 026 ahead of 010 to 019.
4. Confirm that browser E2E waits for phase 4 rather than being built
   against `localStorage` now.
