# Task 078 - Add Testcontainers PostgreSQL Tests Plan

Status: Completed

Written after implementation, not before. The decisions below were
taken during the work, and the section on what the work uncovered
exists because none of it was foreseen. Decision D2 of
`e2e-testing-strategy-plan.md` had already settled the approach, which
is why a task-level plan was skipped at the time; in hindsight the
strategy note covered why, and this covers how.

## Purpose

Verify the migrations and the job routes against a real PostgreSQL
instance rather than against H2 in PostgreSQL mode.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `docs/business/e2e-testing-strategy-plan.md` (decision D2, work
  unit B)
- `tasks/roadmap/078-add-testcontainers-postgres-tests.md`
- `docs/business/077-make-backend-scripts-cross-platform-plan.md`

## Current State Before The Change

- Nine `@SpringBootTest` classes, all against H2 in PostgreSQL mode.
- `FlywayMigrationTest` therefore validated the migrations against a
  database the product never runs on. Anything H2 accepts and
  PostgreSQL rejects passed CI and would have failed on deploy.
- The `jobs` and `tasks` tables were created by Flyway migrations whose
  `on delete cascade` foreign key was never exercised on the engine
  that enforces it.
- The backend CI job had just moved to `ubuntu-latest` in task 077,
  which is what made a Linux container possible.

## Decisions

### D1: a separate `integrationTest` source set

Rejected: keeping these in `src/test` behind a JUnit tag.

Two reasons. `npm run backend:verify` currently needs nothing but Java;
putting a container in the default `test` task would add a Docker
requirement and container startup to every commit, and a check people
stop running constantly is worth less than a slightly narrower one they
keep running. And the coverage gate demands 100 per cent line and
branch - if integration tests fed JaCoCo, coverage would rise because a
container exercised more code, not because anyone wrote a unit test,
and the number would keep reading 100 per cent while meaning less.

### D2: not wired into `tasks.check`, not registered with JaCoCo

The omission is the substance of D1, and omissions are easy to lose
because there is nothing to see. It was verified from the task graph
rather than assumed: `:test` appears in the `check` graph and
`:integrationTest` does not, while ktlint still lints the new source
set. Linted and type-checked on every check, never executed by it.

### D3: pin the image to `postgres:16`

Matching `infra/k8s/local/postgres-deployment.yaml`. Testing against a
different major would prove the migrations work on a database nobody
runs. The pin is deliberately duplicated in an assertion, so bumping
the image without thinking fails a test rather than silently changing
what is being proven.

### D4: `@ServiceConnection` supplies the datasource

Spring Boot reads the container's host, port, and credentials after it
starts. No JDBC URL is written down anywhere, so nothing can drift out
of step with the container.

### D5: one container per JVM, not per Spring context

Taken during review rather than up front; see below. A Kotlin `object`
holds the container and starts it on first access, and the `@Bean`
returns that instance with `destroyMethod = ""` so Spring does not stop
a database other contexts are still using.

### D6: test classes on the classpath, test resources not

`sourceSets["test"].output.classesDirs` rather than `.output`. Fixtures
such as `createJobEntity` stay reusable while
`src/test/resources/application.properties`, which points the datasource
at H2, cannot reach the container. Note that Kotlin `internal` members
do not cross a source-set boundary, so `internal` fixture values are
not visible here.

### D7: `@Transactional` at class level on the CRUD test

Also taken during review. Matches `JobCrudIntegrationTest`, the H2
equivalent, which already proves the create-update-delete-404 sequence
rolls back correctly under MockMvc.

## Tests

Seven, chosen for what H2 structurally cannot prove.

| Case | Why it is here |
| --- | --- |
| the server version starts with `PostgreSQL 16` | guards every other assertion in the source set |
| migrations apply cleanly, nothing pending | H2 accepts syntax PostgreSQL rejects |
| the schema exposes `jobs` and `tasks` | confirms the migrations ran, not just that Flyway reported success |
| job create, read, update, delete over HTTP | real driver and dialect end to end |
| deleting a job cascades to its tasks | the cascade is a foreign key in the migration, not JPA behaviour |
| `numeric(12,2)` salary precision survives a round trip | H2 is more forgiving about scale |
| bug 001's assigned-id insert path | assigned ids go through the driver and dialect |

The version assertion earns its keep more than any of the others.
Without it, a silent fall back to H2 would leave the whole source set
green and meaningless - a suite that cannot notice it is testing the
wrong thing is not evidence.

## What The Work Uncovered

**Testcontainers 2.x renamed its modules.** Spring Boot 4.0.4 pins
2.0.4, where the artifacts are `testcontainers-postgresql` and
`testcontainers-junit-jupiter`. The 1.x coordinates that every example
online uses fail to resolve. Found by reading the BOM rather than
guessing.

**The container was started twice, not once.** A container declared
only as a `@Bean` is scoped to its Spring context, and the two test
classes differ by `@AutoConfigureMockMvc`, which is enough for separate
context cache keys. Each started its own database while a comment
claimed they shared one. Measured with `--rerun-tasks -i`: two start
events. D5 fixed it; the same measurement now reports one.

**The HTTP test leaked rows on failure**, having no class-level
`@Transactional` unlike its H2 counterpart. It was invisible while each
class had a private container, and sharing one container would have
made a single failure cascade into unrelated tests. The two defects
were coupled: fixing the container alone would have traded a wasteful
but safe arrangement for an efficient but flaky one.

**ktlint lints the new source set**, and rejected the first import
order - `tasks` sorts before `testsupport`. Worth knowing that a new
source set inherits the existing style gates rather than escaping them.

## Verification

- `npm run backend:test:integration`: seven tests, no failures, against
  a real container.
- `npm run verify`: unchanged in behaviour and still needs no Docker.
- CI: `Backend Integration` passed on `ubuntu-latest`, listed by job
  name rather than read from a summary line.

## Scope Boundaries

- H2 stays in the `test` source set. This adds a layer rather than
  replacing one.
- No production code changed.
- No coverage for domains that do not exist yet.

## Verified State

Pull request 14.

- `integrationTest` source set, Gradle task, and npm script.
- One shared PostgreSQL 16 container per JVM.
- A `Backend Integration` CI job that uploads its report on failure.

One thing to state precisely, because it has been repeated loosely.
That CI job passing proves Testcontainers works on ubuntu runners. It
says nothing about whether Windows runners could have hosted the same
image, which was the assumption behind task 077's move off
`windows-latest`. That assumption was never tested and should stop
being cited as fact.
