# Task 079 - Run The API Collection In CI Plan

Status: Implemented, pending the pull request run

## Purpose

Turn `docs/api/smart-job-tracker.postman_collection.json` from a set of
requests somebody has to remember to run into an automated end-to-end
gate.

The collection already drives create, list, read, update, delete, the
404 after a delete, and a validation failure, with 22 assertions,
against a live server. Nothing runs it. The Docker Build workflow
already brings the full compose stack up, waits for every healthcheck,
and tears it down in all outcomes. Joining those two facts costs one
workflow step.

This task adds no application code. It adds one npm script, one
adjustment to an existing script, two CI steps, one ignore rule, and
the documentation to go with them.

## Authoritative References

- `AGENTS.md`
- `docs/context.md`
- `docs/api/README.md`
- `docs/engineering/github-pipeline.md`
- `docs/engineering/pr-review.md`
- `tasks/roadmap/079-run-api-collection-in-ci.md`
- `docs/business/e2e-testing-strategy-plan.md` (decision D6, work unit D)
- `docs/business/069-add-docker-compose-for-full-local-stack-plan.md`

## Current State

### The collection

Three folders, verified by reading the file:

| Folder | Requests | Calls OpenAI |
| --- | --- | --- |
| `Health` | 1 | no |
| `Jobs` | 7 | no |
| `AI` | 3 | yes |

`Create job` writes the new id into the `jobId` collection variable and
every later request in `Jobs` reads it. The last request creates
nothing, because it asserts a 400. So a run leaves the database exactly
as it found it.

`Health` calls `GET /api/ai/health`. Despite the path, it reaches no
provider: `AiController.health` returns a static `mapOf("ok" to true)`
in `backend/src/main/kotlin/com/smartjobtracker/ai/AiController.kt`. It
is the same endpoint both Kubernetes probes and the compose backend
healthcheck already use.

### The environments

Both environment files define one variable and differ only in its
value.

| File | `baseUrl` |
| --- | --- |
| `smart-job-tracker-cluster.postman_environment.json` | `http://localhost:30080/api` |
| `smart-job-tracker-local.postman_environment.json` | `http://localhost:4000/api` |

The compose stack publishes the frontend on `127.0.0.1:30080` and
`[::1]:30080`, deliberately the same port as the Kubernetes runtime, so
that only one of the two can run at a time (069 plan). The Cluster
value therefore already addresses the compose stack.

### The pipeline

`.github/workflows/docker-build.yml`, job `Docker Build`, already runs:

1. `npm run compose:config`
2. `npm run docker:build`
3. `docker compose ... up -d --wait`
4. `npm run compose:smoke`
5. compose logs, `if: failure()`
6. `docker compose ... down -v`, `if: always()`

`.github/workflows/ci.yml` has `Frontend Verify`, `Backend Verify`, and
`Backend Integration`. None of them touch a running stack.

`npm run dev:compose` is `docker compose ... up --build -d`, with no
`--wait`, so it returns while the backend is still starting.

Newman is not a dependency, and `docs/api/README.md` says so.

### Verified before writing this plan

Every claim below was run against the live compose stack on this
machine, not inferred.

| Claim | How it was checked |
| --- | --- |
| Newman 6.2.2 accepts a repeated `--folder` | `newman run --help` documents "times to run multiple folders" |
| Scoping to `Health` and `Jobs` runs 8 requests and 22 assertions, and no `AI` request | full run, read the output |
| The run is repeatable against a database that already holds data | seeded an unrelated job, re-ran, 22 of 22 passed, deleted the seed |
| A failing assertion exits non-zero | copied the collection, changed the delete assertion from 204 to 200, ran it: 1 failed, exit code 1 |
| A failure does not stop later requests | that same run still executed all 8 requests |
| The `junit` and `json` reporters need no extra install | ran with both, both files were written |

The throwaway broken copy lived in the scratchpad and was deleted.

## Decisions

### The run joins the existing Docker Build job

The step goes into `.github/workflows/docker-build.yml`, after the
smoke check.

That job has already paid for everything this task needs: both images
built, the stack up, every healthcheck green, and a teardown that runs
`if: always()`. The marginal cost of the gate is one Newman run, a few
seconds.

Rejected: a new workflow, or a new job in `ci.yml`. A separate job gets
a separate status-check name, which reads better in the pull request
list. It would also have to build both images again, because there is
no registry to pull them from, which roughly doubles the slowest part
of the pipeline to buy a label.

Rejected: renaming the workflow so its name matches its widened role.
`Docker Build` is a required status check in branch protection
(`docs/engineering/github-pipeline.md`). Renaming it silently drops that
requirement until somebody notices and re-selects the new name. The
documentation is what gets corrected instead.

### Newman runs after the smoke check, not before

`npm run compose:smoke` asserts properties of the runtime: services
healthy, published ports bound to loopback on both IP stacks and refused
from every other address, the backend publishing nothing, the proxy
answering. Newman asserts the API contract.

Ordering them runtime-first makes a failure legible. If the smoke check
passes and Newman fails, the stack is fine and the contract moved. The
reverse ordering would report a contract failure for what is actually a
stack that never came up.

Rejected: replacing the smoke check with the Newman run. Newman proves
that `localhost:30080/api/jobs` answers correctly, and stays green
through every defect the smoke check was written for, including a
database published on `0.0.0.0` behind a committed default password.
They cover different things.

### Readiness stays in `--wait`, and `dev:compose` gains it

`docker compose up --wait` blocks until every service healthcheck
passes. The backend's healthcheck is a `wget` of `/api/ai/health` with
a 60 second start period. That is exactly the wait the task asks for,
and CI already has it.

Locally it was missing: `npm run dev:compose` returns as soon as the
containers are created, so running the collection immediately after it
would race a starting backend. `--wait` is added there, which also makes
the documented local sequence identical to the CI one.

Rejected: a wait-for-ready script under `infra/scripts/`. Readiness is
already declared, once, in the healthchecks. A polling loop would be a
second definition of ready, and the two would drift.

Rejected: Newman's `--delay-request`, or retrying the run. Covering a
readiness race with a sleep is what `AGENTS.md` section 4 forbids, and
it converts a deterministic failure into an intermittent one.

### The Cluster environment is reused; no third environment file

The compose stack and the Kubernetes runtime publish the same host port
on purpose. One `baseUrl` addresses both.

Rejected: a `smart-job-tracker-compose.postman_environment.json`. It
would contain a byte-identical `baseUrl`, and two files holding the same
value drift the first time one of them is edited.

Rejected: passing `--env-var baseUrl=...` from the workflow. That moves
the API address into a workflow file, when the environment files exist
precisely to be the one place it lives.

The consequence is a documentation change rather than a code one:
`docs/api/README.md` currently presents Cluster as the Kubernetes
environment. It has to say that Cluster covers both runtimes, because
they share the port.

### One script per runtime, added after review

Review found that a single `api:test` pinned to port 30080 had a false
pass in it, and that this plan had walked into it.

Both stacks on 30080 serve a **built image**. The port 4000 runtime
serves the working tree. So a developer changing a controller, running
`npm run dev:backend`, and then running `api:test` gets a green run from
whatever container is still up on 30080 - a backend that has never seen
the change. The `AGENTS.md` row added by this task pointed straight at
that, because it said "against a running stack" without saying which.

Worse, the first draft deleted the ad-hoc `npx newman` line from
`docs/api/README.md`, which had been the only command-line route to port
4000, and replaced it with a script that cannot reach it.

The fix is a second script, `api:test:local`, on the Local environment
file that already existed, writing its reports under distinct
filenames. Each script names one fixed port, and the documentation says
which, and says plainly that 30080 answers from a built image.

Rejected: one script taking the base URL from an environment variable.
`k8s:create-secret` in this same file already does that with `$VAR`, and
`docs/business/e2e-testing-strategy-plan.md` records it as a defect,
because the POSIX syntax does not expand in `cmd.exe`. Repeating it to
avoid a second script line would trade a visible duplicate for an
invisible platform trap.

Rejected: making `api:test` detect which runtime is up. Two ports, two
scripts, no discovery: the developer says which backend they mean, and
a wrong answer is a connection refusal rather than a green run.

### Newman is pinned, and invoked with `npx`

The script calls `npx --yes newman@6.2.2`.

`--yes` because `npx` otherwise prompts before installing a package it
does not have, which would hang a non-interactive runner. The version is
pinned because an unpinned gate can go red on a morning when nothing in
this repository changed.

Rejected: a root devDependency. It puts an install on every `npm ci`,
in every job, for a tool that two commands use. The task file allows
pinning only if CI reliability requires it, and pinning the `npx`
argument achieves the same thing without the dependency.

Rejected: bare `npx newman`. A new major release arriving unannounced
inside a required status check is the failure mode pinning exists for.

### Folder scoping is an allowlist

`--folder Health --folder Jobs`, naming what runs rather than what does
not.

The `AI` folder must never run in CI: it reaches OpenAI through the
backend and costs money per request. An allowlist fails closed. When a
folder is added to the collection later, it does not quietly start
running in the gate; somebody has to add it here on purpose.

Rejected: an exclusion flag. Newman has none, and an exclusion list
would fail open.

`Health` is in the allowlist despite its path, because the endpoint is a
static map and reaches no provider. This is worth stating because the
name suggests otherwise.

### The report is JUnit plus JSON, uploaded on every outcome

Both are built-in Newman reporters, so neither adds an install.

Uploaded `if: always()`, unlike the `if: failure()` used by the
`Backend Integration` job. A green report is the only way to confirm,
without rerunning anything, that the `AI` folder did not execute and
that the assertion count is still what it should be. That is the point
of an allowlist nobody watches.

Rejected: `newman-reporter-htmlextra`. A second `npx` package, fetched
on every run, for nicer formatting of a report that is read only when
something breaks.

### No `--bail`

Verified: without it, a failed assertion does not stop the run, so one
report lists every failure. `--bail` would report the first failure and
hide the rest, which costs a round trip through CI for each one.

### Reports are written to a gitignored `reports/newman/`

A new root directory, added to `.gitignore`.

Rejected: writing into `docs/api/`. That folder is committed and used by
hand; dropping run output into it invites an accidental commit.

Rejected: `backend/build/reports/`. The run is not a backend Gradle
artefact and does not belong under a build directory Gradle owns.

## Proposed Change

### `package.json`

Add one script and adjust one. The new script, wrapped here for
reading, is a single line in the file:

```text
"api:test": "npx --yes newman@6.2.2 run
  docs/api/smart-job-tracker.postman_collection.json
  -e docs/api/smart-job-tracker-cluster.postman_environment.json
  --folder Health --folder Jobs
  -r cli,junit,json
  --reporter-junit-export reports/newman/newman.xml
  --reporter-json-export reports/newman/newman.json"
```

```text
"dev:compose": "docker compose -f infra/docker/compose.yaml up --build -d --wait"
```

`api:test` follows the existing `<area>:<verb>` naming, alongside
`backend:test` and `compose:smoke`.

### `.github/workflows/docker-build.yml`

Two steps, between `Check the compose runtime` and `Compose logs`:

- `Run the API collection` - `npm run api:test`
- `Upload Newman report` - `actions/upload-artifact@v4`, `if: always()`,
  path `reports/newman`, retention 7 days, matching the existing
  artifact step in `ci.yml`

The existing teardown already carries `if: always()`, so a Newman
failure cannot leak a running stack.

### `.gitignore`

Add `reports/`.

### `docs/api/README.md`

- Replace the ad-hoc `npx newman` line under "Running it" with
  `npm run api:test`, and the sequence it needs: `npm run dev:compose`
  first.
- State that the Cluster environment addresses the compose stack as
  well, because both runtimes publish port 30080.
- Correct the paragraph saying these requests are not part of any
  automated run. They now are, in CI, minus the `AI` folder. Keep the
  point it was making: this is not a second unit-test suite, and
  `npm run verify` still does not run it.
- Say why `AI` is excluded and that the exclusion is an allowlist.

### `docs/engineering/github-pipeline.md`

The `Docker Build` section describes a job that only builds images. It
has not matched the workflow since task 069. Rewrite that section to
list the steps as they are, including the new one, and note that the
job now needs Docker Compose on the runner.

## Tests

This task ships a gate rather than test code, so the test is proving the
gate can fail. The task file requires it: a gate never seen to fail is
not known to be a gate.

Procedure, run locally against the compose stack:

1. `npm run api:test` on the unmodified collection. Expect 22 of 22
   assertions passing and exit code 0.
2. Change one assertion in the collection to something false - the 204
   on `Delete job` is the clearest - and run again. Expect exactly one
   failed assertion, the other 21 still passing, all 8 requests still
   executed, and exit code 1.
3. Revert the assertion with `git checkout` rather than by editing, so
   the restore cannot introduce a typo.
4. Run once more. Expect 22 of 22 and exit code 0.

Step 2 is the load-bearing one. Step 3 matters because a hand-restored
assertion that no longer asserts anything would leave the gate green and
useless.

Rules carried from the task file: no assertion is weakened to make the
run pass, and the `AI` folder stays out of CI.

## Implementation Order

Ordered so that each step fails in a way that teaches something.

1. **`.gitignore` first.** So no later step can stage a report file.
2. **`api:test` in `package.json`.** Run it against the stack that is
   already up. Expected failure if a folder name is wrong: Newman exits
   saying the folder was not found, rather than running nothing quietly.
3. **Prove it fails.** The four-step procedure above, before any CI
   work. If the exit code does not propagate through npm, everything
   after this is decoration, so find out now.
4. **`--wait` on `dev:compose`.** Verify by taking the stack down and
   bringing it up again: the command should return only once the backend
   is healthy, roughly a minute rather than instantly. Then run
   `api:test` immediately after it and expect a clean pass with no
   connection error.
5. **The workflow steps.** Not verifiable locally. Expected failure
   modes on the first CI run: `npx` unavailable on the runner, or the
   artifact path missing because the run died before writing a report.
   The `if: always()` upload is what makes the second one diagnosable.
6. **Documentation.** Last, so it describes what was actually built.

## Verification Plan

Focused checks first, per `AGENTS.md` section 3.

| Changed | Check |
| --- | --- |
| `package.json` scripts | run both scripts on this platform |
| `.github/workflows/*.yml` | the pull request run |
| documentation | links, headings, numbering by hand |

```bash
npm run dev:compose
```

```bash
npm run compose:smoke
```

```bash
npm run api:test
```

Then the full run, acknowledging what it does and does not prove:

```bash
npm run verify
```

`npm run verify` exercises no line of this change. It is run because the
change touches `package.json`, and a broken file there would break every
other script. Treating a green `verify` as evidence that this task works
would be a mistake.

The real gate is the pull request: `Docker Build` green with the Newman
step in it, and the report present as an artifact.

## Scope Boundaries

In scope:

- One npm script, one `--wait` added to an existing script.
- Two steps in the existing Docker Build job.
- One ignore rule.
- `docs/api/README.md` and the Docker Build section of
  `docs/engineering/github-pipeline.md`.

Out of scope:

- Rewriting the collection as code. Decision D6 keeps it a Postman
  collection because people run it by hand.
- Browser tests. Task 080.
- Running the `AI` folder anywhere automated.
- Any backend or frontend production change.
- Adding Newman to `npm run verify`. Decision D4 keeps `verify` fast
  and hermetic.
- The `CI` section of `docs/engineering/github-pipeline.md`, which does
  not mention the `Backend Integration` job added by task 078. That is
  real drift, but it is not this job and not this task; it belongs in
  its own change.

## Completion Rules

- Verification above passes, including the deliberate failure.
- The task file's acceptance criteria are ticked.
- `docs/backlog/phase-8-portfolio-polish.md` marks 079 done.
- `docs/business/README.md` links this plan.
- This plan is marked `Completed` with a verified-state section.
- No commit or push without being asked.

## Acceptance Criteria

- [ ] CI starts the stack, runs the API collection, and tears the stack
      down even when the run fails.
- [x] A failing assertion fails the build, demonstrated once.
- [x] The `AI` folder does not run in CI.
- [ ] The Newman report is available as an artifact.
- [x] The same run is documented and works locally.
- [x] The collection is not duplicated into another format.
- [x] No unrelated files are changed.

## Verified State

### What was built

| File | Change |
| --- | --- |
| `package.json` | `api:test` and `api:test:local` added; `dev:compose` gained `--wait` |
| `.github/workflows/docker-build.yml` | two steps: run the collection, upload the report |
| `.gitignore` | `reports/` |
| `docs/api/README.md` | the command-line run, the environment note, why `AI` is excluded |
| `docs/engineering/github-pipeline.md` | the Docker Build section rewritten to match the job |

### What the verification reported

The deliberate-failure procedure, run in full against the live Compose
stack:

| Step | Result |
| --- | --- |
| `npm run api:test`, collection untouched | 8 requests, 22 of 22 assertions, exit 0 |
| the delete assertion changed from 204 to 200 | 8 requests still executed, 21 passed, 1 failed, exit 1 |
| restored with `git checkout` | working tree clean |
| `npm run api:test` again | 22 of 22, exit 0 |

The failing run is the one that matters. `npm` propagates Newman's exit
code, which is the whole mechanism a workflow step fails on.

Readiness, verified by taking the stack down and bringing it back:
`npm run dev:compose` now returns after 29 seconds, when the last
healthcheck goes green, rather than immediately. `npm run compose:smoke`
reported 17 of 17 straight afterwards, and `npm run api:test` run
immediately after that passed 22 of 22 with no connection error. That
sequence is the local equivalent of the CI job, in the same order.

`npm run verify` exits 0. As predicted in the verification plan, it
exercises no line of this change; it was run because `package.json`
changed.

Both workflow files were parsed as YAML rather than read by eye. Step
order in `Docker Build` is: config, build, up, smoke, api:test, upload,
logs on failure, teardown always.

### What is not yet proven

Two acceptance criteria are observations of a pipeline run. Nothing has
watched the workflow execute, so they stay unticked here and in the task
file until the pull request's `Docker Build` check is green with the
`newman-api-report` artifact attached. Ticking them from a local run
would be claiming evidence that does not exist.

The specific risks the first run settles: whether `npx` resolves on the
runner without a `setup-node` step, and whether the artifact upload
finds `reports/newman` when the Newman step itself has failed.

### Review findings, and what they changed

Two defects came out of reviewing the first commit. Both were in the
parts of the change that looked too small to review.

**`api:test` could report a green run against a backend that had never
seen the change.** Covered by the decision above. Fixed with a second
script, `api:test:local`, and documentation in `docs/api/README.md` and
`AGENTS.md` that names the port each one addresses and says which of
them serves a built image.

Verified after the fix, with the Compose stack up on 30080 and
`npm run dev:backend` serving the working tree on 4000 at the same time,
which is exactly the state the false pass needs:

| Command | Requests went to | Result |
| --- | --- | --- |
| `npm run api:test:local` | `localhost:4000` | 22 of 22, exit 0 |
| `npm run api:test` | `localhost:30080` | 22 of 22, exit 0 |

The URLs in the Newman output are the evidence; each script reached its
own backend with both running. Reports are written under distinct
filenames, so the two runtimes do not overwrite each other's results.

**`reports/` in `.gitignore` was unanchored.** Git matches a pattern
with no leading slash at any depth, so it also ignored `docs/reports/`
and `frontend/reports/`. Confirmed with `git check-ignore` before and
after: with `reports/`, a file at `docs/reports/x.md` was ignored; with
`/reports/` it is not, while `reports/newman/` still is. Newman only
ever writes at the repository root, so the anchored form is what was
meant.

The pattern worth keeping from both: the first was a plan-level mistake
that survived into the code because the plan asserted the environments
"fit" without asking what happens when two stacks are up at once.

### One thing found and deliberately left

`docs/engineering/github-pipeline.md` still describes the `CI` workflow
as having two jobs. Task 078 added a third, `Backend Integration`. That
drift is real but it is a different job in a different workflow, so it
is out of scope here rather than a quiet extra fix.
