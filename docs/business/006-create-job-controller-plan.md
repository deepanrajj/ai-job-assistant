# Task 006 - Create Job Controller Plan

Status: Planned

## Purpose

Expose persisted job operations through a Spring MVC controller. This
task adds the public backend controller layer, request/response DTOs,
Bean Validation, and controller tests while reusing the job service from
task 005.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/006-create-job-controller.md`
- `docs/business/005-create-job-service-plan.md`

## Proposed Controller

Add a `JobController` in the existing backend `jobs` package. Controller
routes should be mapped under `/jobs`; the effective public paths are
under `/api/jobs` because the backend already configures
`server.servlet.context-path=/api`.

Controller routes:

```text
GET /jobs
GET /jobs/{id}
POST /jobs
PUT /jobs/{id}
DELETE /jobs/{id}
```

Expected behavior:

- `GET /jobs` returns the list from `JobService.listJobs()`.
- `GET /jobs/{id}` returns `JobService.getJob(id)`.
- `POST /jobs` validates the request, creates a job, and returns
  `201 Created` with the created response body.
- `PUT /jobs/{id}` validates the request, updates the job, and returns
  the updated response body.
- `DELETE /jobs/{id}` deletes the job and returns `204 No Content`.

Task 007 can still harden full end-to-end CRUD behavior after this
controller layer exists.

## DTOs And Mapping

Keep controller DTOs separate from the controller body and separate from
the JPA entity. Add DTOs under a `jobs/dto` package.

Request fields:

```text
company
roleTitle
location
status
jobUrl
salaryMin
salaryMax
description
```

Response fields:

```text
id
company
roleTitle
location
status
jobUrl
salaryMin
salaryMax
description
createdAt
updatedAt
```

Mapping rules:

- Do not expose `userId`.
- Do not add frontend-only `tags` or `nextStep`; they are not in the
  persisted backend job model.
- Map create requests to `CreateJobCommand`.
- Map update requests to `UpdateJobCommand`.
- Map `Job` entities returned by the service to response DTOs.

## Validation And Errors

Use Bean Validation on request DTOs:

- `company` must be non-blank.
- `roleTitle` must be non-blank.
- `status` is optional on create so service command defaulting can keep
  `WISHLIST`.
- `status` is required on update.
- Optional text and salary fields remain nullable.

Use the existing `ApiExceptionHandler` for validation, malformed
request, and typed API errors. Missing jobs should continue to flow from
`JobService` as `404 JOB_NOT_FOUND`.

## Tests

Add `JobControllerTest` using standalone `MockMvc`, a local or test
support fake `JobService`, `LocalValidatorFactoryBean`, and
`ApiExceptionHandler`.

Cover:

- successful list response
- successful read response
- successful create response with `201 Created`
- create request without `status` maps to `WISHLIST`
- successful update response
- successful delete response with `204 No Content`
- blank `company` or `roleTitle` returns `400 VALIDATION_FAILED`
- missing update `status` returns `400 VALIDATION_FAILED`
- service `JOB_NOT_FOUND` returns `404 JOB_NOT_FOUND`

## Verification Plan

Run:

```bash
npm run backend:verify
```

The controller should compile, generated Springdoc metadata should come
from the controller/DTOs without extra annotations unless needed, and
existing service, repository, persistence, error, and AI tests should
continue to pass.

## Scope Boundaries

- No frontend integration.
- No task, note, timeline, contact, reminder, document, search, import,
  profile, entitlement, usage, or AI output endpoints.
- No authentication or user ownership rules.
- No database migration or schema change.
- No direct OpenAI behavior changes.
- No broad end-to-end CRUD hardening beyond controller-level behavior;
  task 007 owns remaining CRUD endpoint gaps.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 006 acceptance criteria complete.
- Mark task 006 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 007.
- Mark this plan `Completed` and add a short verified-state section.
- Update `docs/context.md` Current API to include the new job routes.
