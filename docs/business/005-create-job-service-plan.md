# Task 005 - Create Job Service Plan

Status: Completed

## Purpose

Add backend business logic for persisted job operations. This task
introduces the service layer that future job controllers will call,
without exposing HTTP routes or adding authentication-specific ownership
rules.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/005-create-job-service.md`
- `docs/business/004-create-job-repository-plan.md`

## Completed State Verified

- `JobService` defines the service contract for list, read, create,
  update, and delete behavior.
- `DefaultJobService` implements the contract with `JobRepository`, UTC
  clock timestamps, `WISHLIST` create defaults, and typed not-found
  errors.
- `CreateJobCommand` and `UpdateJobCommand` keep service command models
  separate from future controller DTOs.
- `JOB_NOT_FOUND` is part of the shared API error code model.
- `JobServiceTest` covers list/read, create/update/delete, missing jobs,
  status defaulting, and fixed-clock timestamps.
- `npm run backend:verify` passed.

## Proposed Service

Create a job service interface and default Spring implementation in the
existing backend `jobs` package. The service interface should expose
list, read, create, update, and delete behavior:

```kotlin
fun listJobs(): List<Job>
fun getJob(id: UUID): Job
fun createJob(command: CreateJobCommand): Job
fun updateJob(id: UUID, command: UpdateJobCommand): Job
fun deleteJob(id: UUID)
```

Add service command models for editable job fields only. Keep these
models separate from future controller DTOs. Commands include company,
role title, location, status, job URL, salary min, salary max, and
description.

Create behavior should generate a new UUID, keep `userId` null until
authentication is introduced, default status to `WISHLIST`, and set
`createdAt` and `updatedAt` from an injected UTC clock. Update behavior
should preserve `id`, `userId`, and `createdAt`, replace editable fields,
and refresh `updatedAt`.

## Error Handling

Extend the shared API error code enum with:

```text
JOB_NOT_FOUND
```

Missing jobs in read, update, and delete behavior should throw
`ApiException` with HTTP 404, `JOB_NOT_FOUND`, and the message
`Job not found.`.

## Tests

Add focused service tests using the existing backend Spring Boot, H2,
Flyway, JUnit 5, and AssertJ patterns. Cover:

- list and read behavior
- successful create, update, and delete flows
- `WISHLIST` defaulting during create
- timestamp assignment from a fixed test clock
- missing job errors for read, update, and delete

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add the service and command models.
3. Add `JOB_NOT_FOUND` to the shared API error model.
4. Add the UTC `Clock` bean.
5. Add focused service tests.
6. Run `npm run backend:verify`.
7. After verification passes, mark task and backlog checkboxes complete
   and update this plan status.

## Verification Plan

Run:

```bash
npm run backend:verify
```

The backend should compile, service tests should pass, and existing
repository, persistence, API error, and AI tests should continue to pass.

## Scope Boundaries

- No controller, route, request DTO, response DTO, or OpenAPI endpoint.
- No frontend changes.
- No database migration or schema change.
- No authentication-specific user scoping.
- No task, note, timeline, contact, reminder, document, search, import,
  profile, entitlement, usage, or AI output behavior.
- No additional dependencies.
- No unrelated formatting or refactors.

## Acceptance Criteria

- [x] Job service owns job business logic.
- [x] Errors use the shared API error model.
- [x] Service tests cover behavior.
- [x] `npm run backend:verify` passes before task completion is marked.
