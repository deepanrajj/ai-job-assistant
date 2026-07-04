# Task 003 - Create Job Entity Plan

Status: Completed

## Purpose

Create the first persisted tracker domain model: saved jobs. This task
adds the jobs table through Flyway and maps it with a backend JPA entity,
without exposing any HTTP API contract yet.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/003-create-job-entity.md`
- `docs/business/002-flyway-migration-setup-plan.md`

## Completed State Verified

- Flyway is enabled for backend startup.
- Existing migrations live in `backend/src/main/resources/db/migration`.
- `V1__baseline.sql` establishes the schema origin.
- `V2__create_jobs_table.sql` creates the `jobs` table.
- Backend tests use H2 in PostgreSQL compatibility mode.
- `backend/src/main/kotlin/com/smartjobtracker/jobs/Job.kt` maps the
  planned `Job` model fields.
- `backend/src/test/kotlin/com/smartjobtracker/jobs/JobPersistenceTest.kt`
  covers saving and loading the entity through the Flyway-created table.
- `npm run backend:verify` passes.

## Proposed Schema

Create `V2__create_jobs_table.sql` with a `jobs` table:

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    user_id UUID,
    company VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    job_url VARCHAR(2048),
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

Notes:

- Keep `user_id` nullable until authentication and ownership enforcement
  are introduced.
- Store `status` as a string so the database stays readable and stable
  across enum ordering changes.
- Use `TIMESTAMP WITH TIME ZONE` for audit fields.
- Do not add indexes yet unless the implementation needs them for basic
  persistence tests.

## Proposed Entity

Create a `jobs` package under the backend source root:

```text
backend/src/main/kotlin/com/smartjobtracker/jobs
```

Add a `Job` JPA entity that maps the migration columns and keeps API DTO
concerns separate. Expected Kotlin types:

```text
UUID id
UUID? userId
String company
String roleTitle
String? location
JobStatus status
String? jobUrl
BigDecimal? salaryMin
BigDecimal? salaryMax
String? description
OffsetDateTime createdAt
OffsetDateTime updatedAt
```

Add a `JobStatus` enum in the same package and map it with
`EnumType.STRING`. Match the current frontend lifecycle values:

```text
WISHLIST
APPLIED
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

## Files Created

### `backend/src/main/resources/db/migration/V2__create_jobs_table.sql`

Add the jobs table only. Do not edit `V1__baseline.sql`.

### `backend/src/main/kotlin/com/smartjobtracker/jobs/Job.kt`

Add the JPA entity and status enum. Prefer explicit column names where
Kotlin property names differ from snake_case database columns.

### `backend/src/test/kotlin/com/smartjobtracker/jobs/JobPersistenceTest.kt`

Add focused persistence coverage if the repository pattern is already
available or if `TestEntityManager`/`EntityManager` is the narrowest
existing option. The test should prove the entity maps the table and
that Flyway-created schema supports saving/loading a job.

## Files Updated

### `tasks/003-create-job-entity.md`

Acceptance criteria are marked complete.

### `docs/backlog/phase-3-backend-foundation.md`

Task 003 is marked complete.

### `docs/backlog/README.md`

The recommended next task is task 004.

## Implementation Order

1. Add `V2__create_jobs_table.sql`.
2. Add the `jobs` package and `Job` entity.
3. Add focused persistence or migration coverage.
4. Run `npm run backend:verify`.
5. Update task and backlog checkboxes after verification passes.

## Verification Plan

Run:

```bash
npm run backend:verify
```

The Flyway integration test from task 002 should continue to pass and
report no pending migrations. The new persistence test should prove the
entity maps the `jobs` table.

## Scope Boundaries

- No repository beyond what is required for focused persistence testing.
- No service layer.
- No controller or HTTP endpoint.
- No frontend changes.
- No authentication or required user ownership enforcement yet.
- No task, note, timeline, AI output, contact, reminder, document,
  search, import, profile, entitlement, or usage tables.

## Acceptance Criteria

- [x] Job schema is represented by a Flyway migration.
- [x] Job entity maps the schema.
- [x] No API contract is introduced yet.
