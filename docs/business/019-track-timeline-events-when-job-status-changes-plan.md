# Task 019 - Track Timeline Events When Job Status Changes Plan

Status: Completed

## Purpose

Wire the task 018 entity into actual behavior: writing a timeline event
whenever a job's status changes, and exposing two reads - one job's
full history, and a paginated, capped, cross-job feed the dashboard
(task 043) can consume without one request per job. This is the first
task in the codebase to add pagination.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/019-track-timeline-events-when-job-status-changes.md`
- `tasks/roadmap/032-connect-timeline-tab-to-backend.md`
- `tasks/roadmap/043-add-dashboard-insights.md`
- `docs/business/018-create-timeline-event-entity-plan.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Analytics Must Use History")

## Current State

- `TimelineEvent` (task 018) is immutable, has `jobId`, `type`
  (`TimelineEventType.STATUS_CHANGE` only), `description`,
  `previousStatus`/`nextStatus` (nullable `JobStatus`), `createdAt`. No
  repository, service, controller, or DTO exists yet.
- `DefaultJobService.updateJob` mutates the managed `Job` and returns
  it; it has no notion of "did the status change." It depends only on
  `JobRepository` and `Clock`.
- `JobServiceTest` constructs `DefaultJobService` manually
  (`DefaultJobService(jobRepository, fixedClock)`), which is the only
  place in the codebase that does so directly rather than through
  Spring DI - important below, since a manually constructed bean has no
  `@Transactional` proxy around it.
- No pagination exists anywhere in this codebase yet. There is no
  precedent for page-size capping, a response envelope, or query
  parameter handling to reuse; this task sets the convention.

## Decisions

### `DefaultJobService` depends on `TimelineEventRepository` directly, not a `TimelineEventService`

Writing the event is a plain "insert one row" with no business rule to
enforce (the job already exists - we are updating it), so
`DefaultJobService` gets a third constructor dependency,
`TimelineEventRepository`, the same way `DefaultTaskService` depends on
`JobService` for a *read* check. `TimelineEventService` (added below)
stays scoped to the read side only.

Rejected: injecting `TimelineEventService` into `JobService` for the
write. That would mean the read-oriented service also exposes a write
method nothing else calls, purely to satisfy this one caller, and it
inverts the natural direction (task/note services depend on job
service; making job service depend on timeline service for a write
that timeline's own domain doesn't otherwise need is an awkward fit).

### Status-change detection happens inline in `updateJob`, same transaction, no new event type branch

```kotlin
val previousStatus = job.status
// ...mutate job fields, including job.status = command.status...
if (previousStatus != command.status) {
    timelineEventRepository.save(
        TimelineEvent(
            id = UUID.randomUUID(),
            jobId = job.id,
            type = TimelineEventType.STATUS_CHANGE,
            description = "Status changed from $previousStatus to ${command.status}.",
            previousStatus = previousStatus,
            nextStatus = command.status,
            createdAt = timestamp,
        ),
    )
}
```

`timestamp` is the same `now()` call already used for `job.updatedAt`,
so the event's `createdAt` and the job's `updatedAt` agree exactly for
a given transition - useful for anyone later correlating the two.

Both writes happen inside the one `@Transactional updateJob` method,
so Spring's declarative transaction guarantees them atomic: if the
`save` throws, the whole transaction rolls back, including the pending
`job.status` update. Nothing bespoke is needed to get atomicity; the
work is making sure both writes are genuinely in the same transaction
(see the atomicity test decision below for why that is not automatic
in every test style this codebase uses).

Rejected: comparing `job.status` after mutation. Once `job.status =
command.status` runs, the "before" value is gone; the comparison has
to happen first and be held in a local variable.

### The description is a plain generated sentence, not a template stored anywhere

`"Status changed from $previousStatus to ${command.status}."`, using
the raw enum names (`WISHLIST`, `APPLIED`, ...). No display-name
mapping exists on the backend today - that lives in the frontend's
i18n layer for the job status pill - and inventing one here to make the
sentence prettier is scope this task does not ask for. The structured
`previousStatus`/`nextStatus` columns are what analytics and any future
frontend rendering actually read; `description` is a fallback label,
consistent with the improvements plan's "display text is for people;
analytics must not parse it."

### Job creation never writes a timeline event, regardless of initial status

`createJob` is untouched. The task file is explicit: "Creating a job
with an advanced status does not invent past events." A job created
directly in `APPLIED` (e.g. from a future import feature) has no
`WISHLIST -> APPLIED` transition to record, because it never happened
through this application.

### `TimelineEventRepository` gets one job-scoped finder and one paginated finder

```kotlin
fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<TimelineEvent>

fun findAllByOrderByCreatedAtAscIdAsc(pageable: Pageable): Page<TimelineEvent>
```

Same ordering convention as `tasks`/`notes`: oldest first, `id` breaks
ties for a total order when a fixed test clock makes two events share
an instant. The paginated finder is a derived query too; Spring Data
applies `pageable`'s offset/limit on top of the method name's fixed
sort, so every page is ordered the same way regardless of what a caller
passes as `Pageable` (this method takes a plain `Pageable` only for
its paging, not to accept caller-supplied sorting, since letting a
caller pick history's sort order is not a need this task has).

Verified by reading Spring Data's `PagingAndSortingRepository`
derivation rules before writing this down: a query-method name's
`OrderBy` clause and a passed-in `Pageable.getSort()` compose (the
method's clause runs first), so an unsorted `PageRequest.of(page,
size)` yields exactly the method name's order with no extra code.

### A hand-written `PagedResponse<T>` envelope, not Spring Data's `Page` serialized directly

```kotlin
data class PagedResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
```

Lives in `com.smartjobtracker.api` (a new file, sibling to the existing
`api.error` package), since it is a cross-domain API shape, not
specific to timeline events.

Rejected: returning `org.springframework.data.domain.Page<T>` straight
from the controller. Its default Jackson serialization includes
internal fields (`pageable`, `sort`, `numberOfElements`, `empty`, ...)
that are an implementation detail of Spring Data, not a contract this
project wants to freeze into its public API and document for tasks 032
and 043. A small envelope this project owns is one it can evolve
without that coupling.

### Page size is clamped, not validated with a 400

`page` defaults to `0`, clamped to `0` if negative. `size` defaults to
`20`, clamped to `[1, 100]`. Values outside range are silently
adjusted rather than rejected.

Rejected: rejecting an out-of-range `size` with `400
VALIDATION_FAILED`. Bean Validation as used elsewhere in this codebase
annotates `@RequestBody` DTOs; validating a bare `@RequestParam`
needs `@Validated` on the controller plus a new
`ConstraintViolationException` handler in `ApiExceptionHandler`, which
is new exception-handling machinery this task does not otherwise need.
Clamping is simpler, cannot be exploited to force an unbounded
response, and is not a behavior a legitimate caller would rely on
(nobody wants "the API disagrees with the page size I sent" to be part
of the contract).

### Two read endpoints, one shared response DTO that includes `jobId`

```text
GET /jobs/{jobId}/timeline           -> List<TimelineEventResponse>
GET /timeline-events?page=&size=     -> PagedResponse<TimelineEventResponse>
```

`TimelineEventResponse` carries `id`, `jobId`, `type`, `description`,
`previousStatus`, `nextStatus`, `createdAt`. Unlike `TaskResponse` and
`NoteResponse`, `jobId` is **not** dropped, even on the job-scoped
route, so both endpoints share one DTO and one `toResponse()` mapper.

Rejected: two DTOs (`TimelineEventResponse` without `jobId` for the
job-scoped route, a second type with it for the cross-job route). The
cross-job route cannot function without `jobId` on each row - that is
the whole point of a feed spanning jobs - and one shared, slightly
redundant field on the job-scoped route is a smaller cost than two
near-identical response types and two mapping functions for what tasks
032 and 043 are documented (below) to expect as one contract.

`/timeline-events` is a top-level route, not nested under `/jobs`,
because it is not scoped to one job; nesting it under `/jobs` the way
tasks and notes are would misstate what the endpoint returns.

### No `getTimelineEvent` route, no event mutation route

The task file rules out editing or deleting events, and nothing reads
a single event by id. Only the two list-shaped reads above exist.

### `TimelineEventService` covers only the two reads

```kotlin
interface TimelineEventService {
    fun listTimelineEvents(jobId: UUID): List<TimelineEvent>
    fun listAllTimelineEvents(page: Int, size: Int): Page<TimelineEvent>
}
```

`listTimelineEvents` calls `jobService.getJob(jobId)` first, matching
`DefaultTaskService`/`DefaultNoteService`'s pattern, so a missing job
is `404 JOB_NOT_FOUND` instead of a silently empty list.
`listAllTimelineEvents` has no job to check - it spans every job by
design - and clamps `page`/`size` before calling the repository.

### Testing the atomicity requirement needs a non-transactional test class

`JobServiceTest` constructs `DefaultJobService` manually
(`DefaultJobService(jobRepository, fixedClock)`), bypassing Spring's
proxy machinery entirely - `@Transactional` on a manually built object
has no effect, since AOP transaction advice only wraps beans obtained
through the container. `JobServiceTest` itself is `@Transactional`
only so each test's own DB writes roll back for isolation; it was never
exercising `DefaultJobService`'s own `@Transactional` guarantee, and
still won't after this task.

Verified by reading Spring's transaction-proxy documentation and the
existing test before writing this down: to prove the *framework's*
rollback guarantee actually fires for this method, the test needs the
real, container-managed `JobService` bean, and needs the transaction to
genuinely commit or roll back rather than being nested inside the
test's own already-open transaction (which would only unwind at the
outer test's rollback regardless of what the inner call does, proving
nothing about `updateJob` specifically).

Add `JobUpdateTimelineAtomicityTest`: `@SpringBootTest`, **no**
`@Transactional` at the class level, `@MockitoBean private lateinit var
timelineEventRepository: TimelineEventRepository` configured to throw
on `save(any())`, the real autowired `JobService` and `JobRepository`
beans. One test: seed a job, call `jobService.updateJob(...)` with a
status change, expect the mocked exception to propagate, then - in the
same test, after the call - reload the job through `jobRepository` and
assert its `status` is still the original value. Because this test
class is not transactional, the update's attempted write and the
mocked failure both happen inside `updateJob`'s own real
`@Transactional` boundary, which genuinely rolls back on the DB before
this test's own assertion runs. Clean up the seeded job in `@AfterEach`
since nothing rolls it back automatically.

Rejected: trying to observe this from `JobServiceTest`. That class's
manual construction and blanket `@Transactional` make the framework
guarantee unobservable, not just harder to see.

## Proposed Change

### `TimelineEventRepository`

`backend/src/main/kotlin/com/smartjobtracker/timeline/TimelineEventRepository.kt`:
the two finders above.

### `PagedResponse`

`backend/src/main/kotlin/com/smartjobtracker/api/PagedResponse.kt`.

### `TimelineEventResponse`

`backend/src/main/kotlin/com/smartjobtracker/timeline/dto/TimelineEventResponse.kt`:
the DTO and `TimelineEvent.toResponse()` above.

### `TimelineEventService`

`backend/src/main/kotlin/com/smartjobtracker/timeline/TimelineEventService.kt`:
the interface and `DefaultTimelineEventService`, constructed with
`TimelineEventRepository` and `JobService`. Page clamping constants
(`DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`) live here as the
service is what enforces them.

### `TimelineEventController`

`backend/src/main/kotlin/com/smartjobtracker/timeline/TimelineEventController.kt`:

```text
GET /jobs/{jobId}/timeline                      listTimelineEvents(jobId)
GET /timeline-events?page=&size=                listAllTimelineEvents(page, size)
```

### `DefaultJobService`

Add the `TimelineEventRepository` constructor parameter and the
status-change write described above.

### `JobServiceTest`

Update the manual construction to pass a `TimelineEventRepository`
(autowired, real). Add:

- updating a job's status persists exactly one `TimelineEvent` with the
  correct `previousStatus`/`nextStatus` and a `createdAt` equal to the
  job's new `updatedAt`
- updating a job without a status change persists no event
- updating a missing job persists no event (extends the existing
  not-found test)
- creating a job, including with a non-`WISHLIST` status, persists no
  event

### `JobUpdateTimelineAtomicityTest`

New file, as decided above.

### `TimelineEventPersistenceTest` (task 018, unchanged) plus new tests

No change needed; task 018 already covers the entity's own persistence.

### `TimelineEventServiceTest`, `TimelineEventControllerTest`, `TimelineEventCrudIntegrationTest`

Mirroring the shape `NoteServiceTest`/`NoteControllerTest`/
`NoteCrudIntegrationTest` established, scaled to a read-only surface
(no create/update/delete to test):

- `TimelineEventServiceTest`: lists a job's events in order, throws
  `JOB_NOT_FOUND` for a missing job, lists all events across jobs
  paginated, clamps an out-of-range page size, clamps a negative page
  number.
- `TimelineEventControllerTest`: `FakeTimelineEventService` in
  `testsupport/timeline`; successful list responses for both routes,
  `JOB_NOT_FOUND` propagation, malformed path segment.
- `TimelineEventCrudIntegrationTest`: real controller/service/
  repository/schema through `MockMvc`; seeds a job, updates its status
  twice through the real `JobService`/`JobController` path (or directly
  through the repository, whichever proves the read contract without
  duplicating `JobControllerTest`'s own update coverage), confirms both
  reads return the resulting events with stable ordering, and confirms
  pagination metadata (`totalElements`, `totalPages`) is correct across
  a page boundary using more events than one page holds.

### `docs/context.md`

Add the two new routes to the Current API list.

### Postman collection

Add a `Timeline` folder after `Notes`: create a job, update its status
once (reusing the existing job-update request shape), list the job's
timeline and assert one `STATUS_CHANGE` event with the right
`previousStatus`/`nextStatus`, then hit `/timeline-events` and assert a
`200` with `content`/`page`/`size`/`totalElements`/`totalPages` present
in the response shape. The cross-job endpoint deliberately does not
assert that this run's specific event is present in that response:
`/timeline-events` spans every job in the (shared) test database, so
asserting inclusion would either need an unrealistically large `size`
or be flaky against accumulated state from prior runs. Add `--folder
Timeline` to `api:test`/`api:test:local`.

## Tests

Full list, matching the task file's Tests section:

- status change creates one timeline event (`JobServiceTest`)
- updating a job without status change does not create a status event
  (`JobServiceTest`)
- missing job behavior still returns the expected error, and persists
  no event (`JobServiceTest`)
- event-write failure rolls back the associated status update
  (`JobUpdateTimelineAtomicityTest`)
- paginated history preserves ordering and includes structured
  statuses; equal timestamps do not lose events across pages
  (`TimelineEventServiceTest`/`TimelineEventCrudIntegrationTest`)
- creating a job with an advanced status does not invent past events
  (`JobServiceTest`)

## Implementation Order

1. Add this plan (linked from `docs/business/README.md`).
2. Add `TimelineEventRepository`, `PagedResponse`, `TimelineEventResponse`.
   Nothing calls them yet.
3. Add `TimelineEventService`/`DefaultTimelineEventService`.
4. Update `DefaultJobService` and `JobServiceTest`. This is where a
   missing/incorrect timeline write first surfaces, since
   `JobServiceTest` already runs against a real repository.
5. Add `JobUpdateTimelineAtomicityTest`.
6. Add `TimelineEventController`, `FakeTimelineEventService`
   (`testsupport/timeline`), `TimelineEventControllerTest`.
7. Add `TimelineEventCrudIntegrationTest`.
8. Update `docs/context.md` and the Postman collection;
   `package.json`'s `api:test`/`api:test:local`.
9. Run `npm run backend:test`, `npm run backend:test:integration`,
   `npm run backend:verify`, `npm run verify`.
10. After verification passes, apply the completion rules.

## Verification Plan

```bash
npm run backend:test
npm run backend:test:integration
npm run backend:verify
npm run verify
```

All existing job/task/note/timeline tests must keep passing, and the
100 percent JaCoCo line-and-branch gate must hold, including the new
`com.smartjobtracker.timeline` and `com.smartjobtracker.timeline.dto`
packages and the new `PagedResponse`.

## Scope Boundaries

- No frontend integration (task 032 consumes the job-scoped read; task
  043 consumes the paginated one; neither is this task).
- No event editing or deletion API, ever.
- No event types beyond `STATUS_CHANGE`.
- No historical/backfilled events for existing jobs.
- No `ConstraintViolationException` handling or new Bean Validation on
  query parameters; page size is clamped, not rejected.
- No change to `Task`, `Note`, or their stacks.
- No authentication or user ownership rules.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 019's acceptance criteria.
- Tick task 019 in `docs/backlog/phase-3-backend-foundation.md`.
- Point "Current Recommended Next Task" in `docs/backlog/README.md` at
  the next unchecked task (phase 3 completes with 019; the pointer
  moves into phase 4/frontend work per the backlog's own sequencing
  notes).
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [x] Status changes create timeline events.
- [x] Timeline reads return persisted events.
- [x] Job update and event creation are atomic.
- [x] A documented paginated history contract supports dashboard reads.
- [x] Backend verification passes.

## Verified State

Implemented and verified on the `feat/task-019-track-timeline-events`
branch.

- `DefaultJobService.updateJob` now takes a `TimelineEventRepository`
  and writes one `STATUS_CHANGE` event, in the same `@Transactional`
  method, whenever `previousStatus != command.status`. `createJob`
  never writes an event, regardless of initial status.
- `TimelineEventRepository` gained
  `findAllByJobIdOrderByCreatedAtAscIdAsc` and
  `findAllByOrderByCreatedAtAscIdAsc(Pageable)`.
- `TimelineEventService`/`DefaultTimelineEventService` cover the two
  reads, clamping `page` to `>= 0` and `size` to `[1, 100]`.
- `TimelineEventController` exposes `GET /jobs/{jobId}/timeline` and
  `GET /timeline-events?page=&size=`, the latter wrapped in a new,
  project-owned `PagedResponse<T>` envelope
  (`com.smartjobtracker.api.PagedResponse`) rather than serializing
  Spring Data's `Page` directly.
- `TimelineEventResponse` is shared by both routes and deliberately
  keeps `jobId`, unlike `TaskResponse`/`NoteResponse`, since the
  cross-job route cannot function without it.
- `JobServiceTest` covers: a status change persists one event with the
  correct previous/next status and a `createdAt` matching the job's new
  `updatedAt`; an update with no status change persists nothing; create
  never persists an event, including with an advanced initial status;
  a missing-job update persists nothing.
- `JobUpdateTimelineAtomicityTest` (new, deliberately **not**
  `@Transactional` at the class level) proves the atomicity guarantee
  for real: with `TimelineEventRepository` replaced by a
  `@MockitoBean` that throws on `save`, the real, container-managed
  `JobService` bean's `updateJob` call throws and the job's status,
  reloaded fresh afterward, is unchanged. `JobServiceTest`'s manual
  `DefaultJobService` construction was confirmed (by reading Spring's
  transaction-proxy behavior) to bypass `@Transactional` entirely, so
  this guarantee could not have been observed there.
- `TimelineEventServiceTest`, `TimelineEventControllerTest`
  (`FakeTimelineEventService` added to `testsupport/timeline`), and
  `TimelineEventCrudIntegrationTest` cover ordering, pagination
  (including a page-boundary case with 3 events at `size=2`), clamping,
  missing-job 404s, and the full HTTP path driven through the real
  `JobController` status-update route.
- `docs/context.md`'s Current API section lists both new routes.
- The Postman collection gained a `Timeline` folder (job creation,
  status update through the ordinary job route, job-scoped timeline
  read, missing-job 404, and a shape-only check of the paginated
  cross-job endpoint - deliberately not asserting inclusion of this
  run's event there, since that endpoint spans the whole shared test
  database). `package.json`'s `api:test`/`api:test:local` gained
  `--folder Timeline`.
- `npm run backend:test`, `npm run backend:test:integration`,
  `npm run backend:verify`, and `npm run verify` all passed: ktlint,
  detekt, all tests, and the 100 percent JaCoCo line-and-branch gate.
