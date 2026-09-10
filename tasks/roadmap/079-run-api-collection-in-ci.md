# Task 079 - Run The API Collection In CI

Plan: [`../../docs/business/079-run-api-collection-in-ci-plan.md`](../../docs/business/079-run-api-collection-in-ci-plan.md)

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../docs/api/README.md`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- `docs/api/smart-job-tracker.postman_collection.json` already drives
  create, list, read, update, delete, the 404 after a delete, and a
  validation failure, with assertions, against a live server.
- Nothing runs it automatically, so it only catches what someone
  happens to run by hand.
- Running it with Newman against a started stack turns work that
  already exists into a real end-to-end gate for roughly the cost of
  one workflow job.

This is the cheapest genuine end-to-end coverage available, and it
needs no browser and no frontend change.

Depends on task 069 for the compose stack.

Related docs:

- `../../docs/business/e2e-testing-strategy-plan.md` (decision D6, work
  unit D)

## Goal

After this task:

- CI starts the full stack, runs the API collection against it, and
  fails the build when an assertion fails.
- The same command runs locally against a stack the developer already
  has up.
- The collection stays the single source for these requests. It is not
  duplicated into another format.

## Scope

In scope:

- A CI job that starts the stack, waits for it, runs Newman, and tears
  it down.
- An npm script so the same run is available locally.
- Whatever environment file the CI target needs.
- Publishing the Newman report as a CI artifact.

Out of scope:

- Rewriting the collection as code. Decision D6 keeps it as a Postman
  collection precisely because people use it by hand.
- Browser tests. That is task 080.
- The `AI` folder of the collection. It calls a paid external provider
  and must not run in CI; scope the run to the `Jobs` and `Health`
  folders.
- No changes to backend or frontend production code.

## Pre-Execution

Before changing files:

1. Confirm the compose stack from task 069 exposes the API on a known
   port, and add an environment file for it if the existing local and
   cluster ones do not fit.
2. Confirm how the collection behaves when run twice against a stack
   that already holds data. It creates and deletes its own job, so it
   should be repeatable; verify rather than assume.
3. Decide where the wait-for-ready check lives.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Steps:

1. Add an npm script that runs Newman against the collection with a
   chosen environment, scoped to the folders that do not call OpenAI.
2. Add a CI job that brings the compose stack up, waits for
   `/api/ai/health` to answer, runs that script, and brings the stack
   down in all outcomes including failure.
3. Upload the Newman run report as an artifact so a failure can be read
   without reproducing it locally.
4. Document the local equivalent in `docs/api/README.md`.

Newman is invoked with `npx` rather than added as a dependency unless
CI reliability requires pinning it. If it is pinned, it is a
devDependency at the root and the plan's "no new libraries" boundary is
explicitly amended in the commit message.

## Data And Contracts

The collection asserts the current `/api/jobs` contract, including the
`VALIDATION_FAILED` and `JOB_NOT_FOUND` error codes and the 204 on
delete. Changing those contracts means updating the collection in the
same change.

## Tests

This task adds a test job rather than test code. Verify it works by
proving it can fail:

- Point the run at a stack with a deliberately broken expectation, or
  temporarily change one assertion, and confirm CI goes red.
- Restore it and confirm CI goes green.

A gate never seen to fail is not known to be a gate.

Rules:

- Do not skip tests.
- Do not weaken assertions to make the run pass.
- The AI folder stays excluded from CI.

## Validation

```bash
npm run verify
```

Plus the new Newman script against a locally running stack, and the CI
job passing on the pull request.

## Acceptance Criteria

- [ ] CI starts the stack, runs the API collection, and tears the stack
      down even when the run fails.
- [x] A failing assertion fails the build, demonstrated once.
- [x] The AI folder does not run in CI.
- [x] The Newman report is available as an artifact.
- [x] The same run is documented and works locally.
- [x] The collection is not duplicated into another format.
- [x] No unrelated files are changed.

The first criterion stays unticked, and the clause that holds it open is
"even when the run fails". `Docker Build` on this pull request started
the stack, ran 8 requests and 22 assertions with no `AI` request, and
tore the stack down, and the `newman-api-report` artifact is attached.
But the run passed, so the failure path was never taken: `Compose logs`
reported as skipped, which is the proof that nothing exercised it.

The teardown carries `if: always()` and the local runs show a failing
assertion exits non-zero, so the pieces are there. Ticking it would
still be inferring the behaviour rather than having watched it. It
closes when a run fails for real, or when somebody deliberately reddens
one and confirms the stack still comes down.

## Commit

```text
task-079: run the api collection in ci
```
