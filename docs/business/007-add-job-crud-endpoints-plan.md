# Task 007 - Add Job CRUD Endpoints Plan

Status: Completed

## Purpose

Prove that job CRUD works end to end over HTTP and close the gaps left
by tasks 003-006. This task adds almost no production behaviour. Its
value is coverage of the seams between the controller, service,
repository, and database, which every existing test replaces with a
fake or builds by hand.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `docs/engineering/pr-review.md`
- `tasks/007-add-job-crud-endpoints.md`
- `docs/business/006-create-job-controller-plan.md`

## Current State Verified

Task 006 shipped the five job routes and they work when exercised by
hand against local PostgreSQL. The automated tests, however, only cover
each layer in isolation:

- `JobPersistenceTest` maps the entity against H2 and Flyway.
- `JobRepositoryTest` covers the newest-updated-first finder.
- `JobServiceTest` covers business policy against a real repository,
  but constructs `DefaultJobService` by hand.
- `JobControllerTest` covers routes, validation, and status codes with
  standalone `MockMvc` and a `FakeJobService`.

Nothing asserts that the layers are connected. No test in
`backend/src/test` boots the application and issues an HTTP request
through the real controller, service, repository, and database.

Specific gaps:

- No full-stack HTTP test exists for any job route.
- `PUT` and `DELETE` missing-job behaviour is proven at the service
  layer only. Neither has travelled through `ApiExceptionHandler` to an
  HTTP 404 response.
- The response contract is not pinned. Standalone `MockMvc` builds its
  own Jackson configuration, so the existing controller tests cannot
  show how `createdAt` and `updatedAt` serialize in the running
  application.
- No test proves data survives between requests: create then read, or
  delete then read.
- Generated OpenAPI documents success responses only. The `400` and
  `404` shapes returned by `ApiExceptionHandler` are not described.

## Proposed Changes

### Integration test

Add a full-stack CRUD test:

```text
backend/src/test/kotlin/com/smartjobtracker/jobs/JobCrudIntegrationTest.kt
```

Use `@SpringBootTest`, `@AutoConfigureMockMvc`, and `@Transactional`,
with `MockMvc` and `JobRepository` injected. The injected `MockMvc` is
built from the real application context, so the request path exercises
the real controller, the real `DefaultJobService`, the real repository,
Flyway-created schema, and the application's Jackson configuration.

Use `JobRepository` to assert database state independently of the API.
A create that returns `201` proves what the controller reported; the
repository read proves the row exists.

Keep the count small. Integration tests are slow and a failure can be
anywhere. Isolated tests remain the place for exhaustive branch
coverage.

### Error responses in OpenAPI

Document the error contract on the job routes so the generated
OpenAPI describes the `ApiErrorResponse` shape for `400` and `404`.
This supports the acceptance criterion that response contracts are
typed and stable, and the frontend integration work in phase 4 reads
these shapes.

This is the one judgement call in the plan. `backend/AGENTS.md` §3 says
to add annotations only when they clarify generated documentation. If
the annotation noise outweighs the benefit during implementation, drop
this item and record the decision here.

## Tests

Cover in `JobCrudIntegrationTest`:

- create through `POST` returns `201`, the response body matches the
  request, and the row is present through `JobRepository`
- read through `GET /jobs/{id}` returns the created job
- list through `GET /jobs` returns created jobs newest-updated first
- update through `PUT` returns `200`, changes editable fields,
  preserves `createdAt`, and refreshes `updatedAt`
- delete through `DELETE` returns `204` and removes the row
- `GET`, `PUT`, and `DELETE` on an unknown id each return `404` with
  code `JOB_NOT_FOUND`
- timestamps serialize as ISO-8601 instants and `userId` never appears
  in a response body

Do not duplicate the validation matrix already covered by
`JobControllerTest`. One representative validation failure through the
real stack is enough to prove `ApiExceptionHandler` is registered.

## Implementation Order

1. Add this planning document and link it from `docs/business/README.md`.
2. Add `JobCrudIntegrationTest` with the create and read round trip.
3. Extend it to list, update, and delete.
4. Add the missing-job cases for `GET`, `PUT`, and `DELETE`.
5. Decide on the OpenAPI error responses item and implement or drop it.
6. Run `npm run backend:verify`.
7. After verification passes, update the task and backlog checkboxes and
   mark this plan `Completed` with a verified-state section.

## Verification Plan

Run:

```bash
npm run backend:verify
```

All existing persistence, repository, service, controller, error, and
AI tests must continue to pass, and the 100 percent JaCoCo gate must
hold.

Note that tests run against H2 in PostgreSQL compatibility mode, not
PostgreSQL. This task proves application wiring, not PostgreSQL
specific behaviour. Testing against real PostgreSQL would require
Testcontainers, which is a new dependency and therefore out of scope.

## Scope Boundaries

- No pagination or filtering on the list route. That changes the
  response contract and belongs to its own task. The concern is tracked
  as a reliability finding in `docs/engineering/pr-review.md` §3.3.
- No new production routes, request fields, or response fields.
- No database migration or schema change.
- No frontend integration.
- No authentication or user ownership rules.
- No task, note, timeline, contact, reminder, document, search, import,
  profile, entitlement, usage, or AI output behaviour.
- No new dependencies, including Testcontainers.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and `npm run backend:verify` pass:

- Mark task 007 acceptance criteria complete.
- Mark task 007 complete in the phase 3 backlog.
- Update the backlog recommended next task to task 008.
- Mark this plan `Completed` and add a short verified-state section.

## Acceptance Criteria

- [x] Job CRUD works through HTTP, proven by an automated test against
      the real application context.
- [x] Response contracts are typed and stable, including timestamp
      format and the absence of `userId`.
- [x] Missing-job behaviour returns `404 JOB_NOT_FOUND` for read,
      update, and delete over HTTP.
- [x] `npm run backend:verify` passes before task completion is marked.

## Verified State

Implemented and verified on the task 007 branch.

- `JobCrudIntegrationTest` boots the application with
  `@SpringBootTest` and `@AutoConfigureMockMvc` and covers create,
  read, list ordering, update, delete, the three missing-job cases, one
  validation failure, and the response shape. Eight tests.
- The OpenAPI error responses item was implemented rather than dropped.
  `400` and `404` are declared on the job routes with the
  `ApiErrorResponse` schema, and `OpenApiConfigTest` asserts they
  appear in the generated document alongside the success responses.
- `createJobEntity` gained `userId`, `createdAt`, and `updatedAt`
  parameters with defaults, so the existing task 006 call sites are
  unchanged.
- `npm run backend:verify` passes: ktlint, detekt, 58 tests, and the
  100 percent JaCoCo gate.

Note for future readers: the update test captures `createdAt` and
`updatedAt` into locals before issuing the request. The seeded entity
is the managed JPA instance, so the update writes through it and
asserting against the entity reference would compare it with itself.
