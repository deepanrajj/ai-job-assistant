# AGENTS.md - Agent Instructions

Mandatory for this repository. All implementing and reviewing agents
must follow this file before changing code, docs, scripts, tests, or
infrastructure.

Authoritative companion docs:

- `docs/context.md` - product vision, architecture, stack, locked decisions.
- `docs/backlog/README.md` - phase roadmap and execution backlog.
- `tasks/` - numbered implementation tasks.
- `templates/task-template.md` - canonical task file template.
- `docs/business/` - product and feature planning notes.
- `docs/engineering/` - engineering decisions, testing notes, and runbooks.

If code and documentation disagree, inspect the code first, then update
the documentation in the same change when the task requires it. If a
task explicitly references `docs/context.md`, treat that context as the
product source of truth and stop to ask before changing locked
decisions.

---

## 0. Global Rules

- Make the smallest change that solves the task.
- Do not perform drive-by refactors, unrelated formatting, or
  speculative abstractions.
- Inspect existing patterns and tests before adding new structure.
- Do not introduce new libraries unless the task explicitly asks for
  them.
- Add or update tests for production behavior changes in the affected
  layer.
- Do not delete, skip, weaken, or rewrite tests only to make the suite
  pass.
- Do not commit secrets, API keys, local environment files, build
  output, coverage output, or generated logs.
- Keep modified files scoped to the task.
- Ensure every modified text file ends with a newline.

## 1. Project Structure

```text
frontend/   React + Vite frontend
backend/    Kotlin + Spring Boot backend
infra/      Docker, Nginx, Kubernetes, and local runtime scripts
docs/       context, setup, architecture, backlog, and planning docs
tasks/      roadmap tasks in tasks/roadmap/, defects in tasks/bugs/
templates/  reusable task and bug templates
```

Read the more specific instructions before editing inside an app:

- `frontend/AGENTS.md` before editing `frontend/`.
- `backend/AGENTS.md` before editing `backend/`.

More specific instructions win for their folder. `docs/context.md`
wins for product and architecture intent.

## 2. Task Execution

- Execute exactly one numbered task at a time when a task file is
  present.
- Task files live in `tasks/roadmap/<number>-<slug>.md`.
- Do not infer extra scope from a phase checklist item. The task file
  is the execution boundary.
- For multiple sequential tasks, complete one task before starting the
  next.
- Preferred commit message format:

```text
task-<number>: <one-line summary>
```

Examples:

```text
task-001: add postgresql docker service
task-020: add frontend job service
```

Defects are tracked separately from roadmap tasks. Bug files live in
`tasks/bugs/bug-<number>-<slug>.md` with their own numbering
sequence, use `templates/bug-template.md`, and commit as:

```text
bug-<number>: <one-line summary>
```

See `tasks/bugs/README.md` for when to file a bug rather than fix it
in the change that found it.

## 3. Verification

Use the narrowest relevant verification while iterating, then run the
full project verification before finalizing a code change.

```bash
npm run frontend:verify
npm run backend:verify
npm run verify
```

### Always run the focused check for what you changed

Pick the row matching the files in your diff and run it **before** the
full verification, every time. The full run is slow and, for the
infrastructure rows, does not exercise the changed thing at all.

| Changed area | Focused check |
| --- | --- |
| `frontend/**` | the affected Vitest file, then `npm run frontend:verify` |
| `backend/**` | `npm run backend:test`, then `npm run backend:verify` |
| `backend/**` touching entities, repositories, or `db/migration` | `npm run backend:test:integration` as well; it runs against a real PostgreSQL |
| `infra/docker/compose.yaml`, `.env.example` | `npm run compose:config`, then `npm run dev:compose` and `npm run compose:smoke` |
| `infra/docker/*.Dockerfile`, `nginx.conf` | `npm run docker:build`, then the compose row above; both runtimes share these files |
| `infra/k8s/**` | `kubectl kustomize infra/k8s/local`, then bring the cluster up with the `start-local` skill |
| `infra/scripts/**`, script changes in `package.json` | run the script itself, on this platform |
| `docs/api/*.json`, or any change to the `/api/jobs` contract | `npm run api:test` against a running stack |
| documentation only | check links, headings, and numbering by hand |

`npm run compose:smoke` asserts properties of a *running* stack that no
static check can see: that every service reports healthy, that published
ports are bound to loopback on both IP stacks and refused from every
non-internal address this host has, that the backend still publishes
nothing, and that the app and API answer through the proxy. It needs the
stack already up. Two defects on the task 069 branch were invisible to
`docker compose config` and to a `curl` from the host, and this is the
check that catches them. CI runs it as well, so a change that skips it
locally still gets caught.

`npm run api:test` runs the Postman collection in `docs/api/` against a
running stack with Newman. It needs the stack up, and
`npm run dev:compose` now returns only once every service is healthy,
so the two run back to back. It is scoped to the `Health` and `Jobs`
folders by an allowlist; the `AI` folder reaches a paid provider and
must never run automatically. CI runs it in the Docker Build workflow.
See [`docs/api/README.md`](./docs/api/README.md).

Documentation-only changes do not require unit tests, but links,
numbering, and Markdown should still be checked manually.

When a local runtime or verification command fails for reasons that look
environmental rather than code-related - container DNS, a healthcheck
that fails while the service works, Compose variables, or a Gradle run
that will not start - read
`docs/engineering/local-runtime-environment.md` before debugging
further. It also records which workarounds are specific to one machine
and must not be copied into a Dockerfile, manifest, or workflow.

## 4. Test Preservation

- If existing tests fail after a change, investigate before modifying
  tests.
- Existing tests may change only when expected behavior intentionally
  changed.
- Do not use skipped tests, disabled tests, weakened assertions, or
  sleeps to hide failures.
- If the correct behavior is unclear, stop and ask.

## 5. Documentation Rules

- Keep `docs/context.md` concise and authoritative.
- Do not duplicate long context across README files.
- After completing and verifying a numbered task, update the relevant
  task file, backlog files, business plan, and authoritative docs in the
  same change when the completed behavior changes documented state.
- Update task checkboxes only when the behavior is implemented and
  verified.
- Keep phase backlog files as roadmap summaries.
- Keep `tasks/` as execution-ready work units.

## 6. PR Review Mode

When asked to review code, stay in review mode unless the user
explicitly asks for fixes.

See `docs/engineering/pr-review.md` for the full review procedure:
inputs to read, categories, the must-catch list, hotspots, severity
calibration, and fix mode.

Review findings should focus on:

- correctness bugs
- test gaps
- security or secret handling issues
- accessibility regressions
- API contract drift
- scope drift from the task file
- violations of `frontend/AGENTS.md`, `backend/AGENTS.md`, or
  `docs/context.md`

Use this format for review findings:

```text
**[P1] Short title**
File: `path/to/file:line`
Rule: AGENTS.md section or app AGENTS.md section
Issue: One or two sentences.
Suggested fix: One or two sentences.
```

Severity:

- `P1` - blocking correctness, safety, security, or scope issue.
- `P2` - should fix before merge.
- `nit` - optional cleanup.

Do not approve while any `P1` finding remains.
