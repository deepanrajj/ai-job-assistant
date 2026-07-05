# Task 004 - Create Job Repository Plan

Status: Completed

## Purpose

Add repository access for the persisted `Job` entity created in task
003. This task should introduce the smallest Spring Data repository
surface needed by the upcoming backend job service, without exposing an
HTTP API or adding authentication-specific ownership rules.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/004-create-job-repository.md`
- `docs/business/003-create-job-entity-plan.md`

## Completed State Verified

- Flyway is enabled and applies migrations from
  `backend/src/main/resources/db/migration`.
- `V2__create_jobs_table.sql` creates the `jobs` table.
- `backend/src/main/kotlin/com/smartjobtracker/jobs/Job.kt` maps the
  persisted job entity and `JobStatus` enum.
- `backend/src/main/kotlin/com/smartjobtracker/jobs/JobRepository.kt`
  adds Spring Data repository access for persisted jobs.
- `backend/src/test/kotlin/com/smartjobtracker/jobs/JobRepositoryTest.kt`
  verifies newest-updated-first list ordering.
- Backend tests use H2 in PostgreSQL compatibility mode with Flyway
  managing the schema.
- No job service, controller, or backend job CRUD API exists yet.
- `npm run backend:verify` passes.

## Proposed Repository

Create a Spring Data repository in the existing backend `jobs` package:

```text
backend/src/main/kotlin/com/smartjobtracker/jobs/JobRepository.kt
```

The repository should extend `JpaRepository<Job, UUID>` so the upcoming
service can reuse standard CRUD operations for create, read, update, and
delete behavior.

Add one explicit custom finder:

```kotlin
fun findAllByOrderByUpdatedAtDesc(): List<Job>
```

This keeps list retrieval stable and matches the current tracker
behavior where newly created or recently updated jobs appear first. Do
not add `userId` scoped methods yet; authentication and user ownership
are deferred to later tasks.

## Repository Tests

Add focused repository coverage only because persistence test
infrastructure already exists:

```text
backend/src/test/kotlin/com/smartjobtracker/jobs/JobRepositoryTest.kt
```

The test should:

- Persist multiple jobs through `JobRepository`.
- Use different `updatedAt` values.
- Assert `findAllByOrderByUpdatedAtDesc()` returns newest updated jobs
  first.
- Avoid exhaustively retesting inherited Spring Data CRUD behavior.

Use existing Spring Boot, H2, Flyway, JUnit 5, and AssertJ patterns.

## Implementation Order

1. Add `JobRepository.kt`.
2. Add `JobRepositoryTest.kt`.
3. Run focused backend tests if useful while iterating.
4. Run `npm run backend:verify`.
5. Only after verification passes, update task and backlog checkboxes in
   the implementation change.

## Verification Plan

Run:

```bash
npm run backend:verify
```

The repository should compile, the custom finder should be covered by
tests, and existing Flyway/entity persistence tests should continue to
pass.

## Scope Boundaries

- No service layer.
- No controller, DTO, route, or OpenAPI contract.
- No frontend changes.
- No new database migration or schema change.
- No task, note, timeline, contact, reminder, document, search, import,
  profile, entitlement, usage, or AI output repositories.
- No authentication-specific scoping.
- No additional dependencies.
- No unrelated formatting or refactors.

## Acceptance Criteria

- [x] `JobRepository` compiles in the `jobs` package.
- [x] The only custom query method is explicit and needed by the
      upcoming job service.
- [x] Repository tests verify newest-updated-first list ordering.
- [x] `npm run backend:verify` passes before task completion is marked.
- [x] No unrelated persistence code is added.
