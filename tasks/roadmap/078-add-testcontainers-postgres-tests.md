# Task 078 - Add Testcontainers PostgreSQL Tests

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- Every database-backed backend test runs against H2 in PostgreSQL
  mode, which is a compatibility approximation, not PostgreSQL.
- `FlywayMigrationTest` therefore validates the migrations against a
  database the product never runs on. A migration that H2 accepts and
  PostgreSQL rejects passes CI and fails on deploy.
- The differences that bite are timestamp-with-time-zone semantics
  against `OffsetDateTime`, `uuid` storage and comparison, `numeric`
  precision on the salary columns, foreign-key and cascade timing, and
  any PostgreSQL-only syntax a future migration reaches for.

Task 077 is done, so the prerequisite is met: the backend CI job now
runs on `ubuntu-latest`, confirmed green on pull request 13.

Testcontainers needs a Linux PostgreSQL image, which the previous
`windows-latest` job was not expected to run. That expectation was
never tested against a real runner and no longer needs to be - this
task's own CI job is the first thing that will actually exercise a
Linux container here, so treat a failure there as new information
rather than as a broken setup.

Related docs:

- `../../docs/business/e2e-testing-strategy-plan.md` (decision D2, work
  unit B)

## Goal

After this task:

- The migrations and the job CRUD flow are verified against a real
  PostgreSQL instance.
- `npm run backend:verify` still runs on H2 and still needs no Docker,
  so the fast inner loop is unchanged.
- CI runs the PostgreSQL-backed tests on every pull request.

## Scope

In scope:

- Adding the Testcontainers dependency.
- A separate `integrationTest` source set and Gradle task that runs
  against real PostgreSQL.
- Coverage for the migrations and for the job CRUD flow on that source
  set.
- A CI job that runs it.

Out of scope:

- Replacing H2 in the existing `test` source set. Decision D2 keeps
  both deliberately; see below.
- Adding PostgreSQL-backed coverage for domains that do not exist yet.
- Browser or HTTP-level end-to-end tests. Those are tasks 079 to 081.
- No other new libraries.
- No production code changes. If a real PostgreSQL difference is found,
  file it in `../bugs/` rather than fixing it here.

## Pre-Execution

Before changing files:

1. Confirm the PostgreSQL version the product runs on, from
   `infra/k8s/local/postgres-deployment.yaml`, and pin the container
   image to it. Testing against a different major version proves less
   than it appears to.
2. Decide which existing tests move and which are duplicated.
3. Confirm how the `integrationTest` source set interacts with the
   JaCoCo configuration.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Implementation boundaries:

- Reuse existing naming, structure, and patterns.
- Keep changes minimal.

Steps:

1. Add Testcontainers with the PostgreSQL module as a test dependency.
2. Add an `integrationTest` source set under
   `backend/src/integrationTest/kotlin` and a matching Gradle task.
   Wire it so `npm run backend:verify` does **not** run it and
   `tasks.check` does not depend on it.
3. Add a shared base class or Spring test configuration that starts one
   PostgreSQL container per run and points the datasource at it.
   Reuse a single container across classes; starting one per class is
   slow enough to discourage people from running the suite.
4. Add a migration test on that source set proving Flyway applies every
   migration cleanly to an empty real PostgreSQL database.
5. Add a job CRUD test on that source set covering the same ground as
   `JobCrudIntegrationTest`, so the HTTP-to-database path is proven
   against the real engine.
6. Add an `npm run backend:test:integration` script, cross-platform per
   task 077.
7. Add a CI job that runs it on `ubuntu-latest`.

## Data And Contracts

No schema change. The existing Flyway migrations are the input under
test; they are not edited.

Environment: the new Gradle task requires a working Docker daemon.
Document that.

## Tests

Required test coverage:

- Flyway applies all migrations to an empty real PostgreSQL database
  without error.
- A job is created, read, updated, and deleted over HTTP against real
  PostgreSQL, asserting the same behaviour `JobCrudIntegrationTest`
  asserts on H2.
- The `tasks` foreign key cascade behaves on real PostgreSQL as
  `TaskPersistenceTest` asserts on H2.

Rules:

- Use existing test infrastructure and fixtures where they fit.
- Do not skip tests.
- Do not weaken assertions.
- Keep tests deterministic. No dependency on execution order or on
  rows left behind by another test.

## Validation

```bash
npm run backend:verify
```

```bash
npm run backend:test:integration
```

The first must still pass without Docker running. Confirm that
explicitly rather than assuming it.

## Acceptance Criteria

- [x] Testcontainers runs the migrations against real PostgreSQL,
      pinned to the version the product deploys.
- [x] The job CRUD flow is covered against real PostgreSQL.
- [x] `npm run backend:verify` is unchanged in behaviour and still
      needs no Docker.
- [x] The integration source set does not distort the JaCoCo gate.
- [x] A CI job runs the PostgreSQL tests on every pull request.
      Confirmed on pull request 14: Backend Integration success on
      ubuntu-latest.
- [x] Any real behavioural difference found between H2 and PostgreSQL
      is filed in `../bugs/`, not fixed here.
- [x] No unrelated files are changed.

## Commit

```text
task-078: add testcontainers postgres tests
```
