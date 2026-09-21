# Task 018 - Create Timeline Event Entity Plan

Status: Completed

## Purpose

Add the fourth persisted tracker domain model: an append-only history
of what happened to a job. This is simpler than tasks and notes in one
sense (no controller, service, or repository in this task; task 019
owns the read/write behavior) and different in another: every column
is immutable, since nothing ever edits a recorded event.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/018-create-timeline-event-entity.md`
- `tasks/roadmap/019-track-timeline-events-when-job-status-changes.md`
- `docs/business/013-create-note-entity-plan.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("Analytics Must Use History")

## Current State

- `V4__create_notes_table.sql` is the latest migration; the next free
  version is `V5`.
- `Job` (`com.smartjobtracker.jobs.Job.kt`) declares `JobStatus` as a
  top-level enum in the same file, mapped with
  `@Enumerated(EnumType.STRING)` onto a plain `VARCHAR(50)` column with
  no database-level check constraint. A new enum value never needs a
  migration.
- No `timeline` package exists.
- `docs/context.md` section 5 defines the planned shape:
  `TimelineEvent: id, jobId, type, description, previousStatus,
  nextStatus, createdAt`. Notably no `updatedAt` - every other entity
  so far has one.
- The improvements plan's "Analytics Must Use History" section requires
  status events to expose structured previous/next statuses, not just
  a display string, and says display text is for people while
  analytics must not parse it.

## Decisions

### The entire entity is immutable

Every column is `val`. `Job`, `Task`, and `Note` each have at least one
`var` column because something updates them; nothing ever updates a
timeline event; the task file says so directly ("Keep events
append-only," "No event mutation API is introduced"). This is the
first entity in the codebase with no editable column at all, so there
is no `updatedAt` and no KDoc paragraph about mutating a managed
instance - that whole convention doesn't apply here.

Rejected: adding `updatedAt` for symmetry with other entities.
`docs/context.md`'s planned shape deliberately omits it, and an
immutable row updating itself would be a contradiction.

### Reference the job by id, not by association

Same reasoning as tasks and notes: `jobId: UUID`, not a `@ManyToOne`
`Job`. No lazy-loading risk, trivial mapping later, and a future
repository can expose `findAllByJobId(...)` directly.

### Deleting a job deletes its timeline events

`ON DELETE CASCADE`, matching `tasks` and `notes`. An event with no job
is meaningless, and this keeps `DefaultJobService.deleteJob` as a
single `deleteById` call without a third manual child-delete.

### `type` is a small enum with exactly one value for now

Add `TimelineEventType` with a single constant, `STATUS_CHANGE`. The
task file's scope is "store event type" generically, but task 019 (the
only consumer planned right now) only ever creates a status-change
event. Adding speculative future types (e.g. a note-added or
task-completed event) here would be scope this task file does not ask
for, and `AGENTS.md` says not to design for hypothetical future
requirements.

This costs nothing to extend later: `type` maps with
`@Enumerated(EnumType.STRING)` onto `VARCHAR(50)` with no check
constraint, exactly like `JobStatus`, so a future task adds a new enum
constant with no migration.

### `previousStatus` and `nextStatus` are nullable `JobStatus` columns

Both map with `@Enumerated(EnumType.STRING)` onto nullable
`VARCHAR(50)` columns, reusing `JobStatus` rather than inventing a
separate status enum for the timeline. The task file says status
events store them structured and "other event types may leave them
empty" - with only `STATUS_CHANGE` existing today, this task proves
the columns are nullable (a persistence test round-trips an event with
both set, matching what task 019 will always do) rather than inventing
a second event type just to exercise the null path.

Rejected: a single JSON/text "details" column. The improvements plan is
explicit that analytics must read structured previous/next statuses,
not parse a description string. A JSON column would just move the
parsing problem into the query layer instead of removing it.

### `description` is free text, not null

`description: String`, `TEXT`, `NOT NULL`. This is the human-readable
line ("Status changed from Wishlist to Applied") that a timeline UI
displays; task 019 is responsible for generating it, this task only
provides the column. Not nullable: an event with no description is not
a useful event, and nothing after this task can supply one after the
fact since the row can never be edited.

### Index on `job_id` only, matching `tasks` and `notes`

`idx_timeline_events_job_id` on `job_id`. Task 019 defines the actual
paginated cross-job read contract; if that read pattern needs a
composite index (e.g. `(job_id, created_at)`), that is task 019's
decision to make against a real query, not a guess made here.

## Proposed Schema

Create `V5__create_timeline_events_table.sql`:

```sql
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    previous_status VARCHAR(50),
    next_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_timeline_events_job_id ON timeline_events (job_id);
```

Do not edit `V1`-`V4`; Flyway checksums applied migrations.

## Proposed Entity

Create the package `com.smartjobtracker.timeline` and add
`TimelineEvent.kt`:

| Field | Type | Nullable | Column |
| --- | --- | --- | --- |
| `id` | `UUID` | no | `id` (from `AssignedIdEntity`) |
| `jobId` | `UUID` | no | `job_id` |
| `type` | `TimelineEventType` | no | `type` (`@Enumerated(STRING)`) |
| `description` | `String` | no | `description` |
| `previousStatus` | `JobStatus?` | yes | `previous_status` (`@Enumerated(STRING)`) |
| `nextStatus` | `JobStatus?` | yes | `next_status` (`@Enumerated(STRING)`) |
| `createdAt` | `OffsetDateTime` | no | `created_at` |

Every field is `val`. Extend `AssignedIdEntity` exactly as `Job`,
`Task`, and `Note` do. `TimelineEventType` is a second top-level enum
in the same file, mirroring how `JobStatus` sits in `Job.kt`.

## Tests

Add `backend/src/test/kotlin/com/smartjobtracker/timeline/TimelineEventPersistenceTest.kt`
following `NotePersistenceTest`'s shape:

- persist a status-change event against a saved job (with both
  `previousStatus` and `nextStatus` set) and read every column back,
  including the enum round trips
- deleting the job removes its timeline events, proving the cascade
  applies
- a timeline event referencing an unknown job is rejected, proving the
  foreign key is enforced

Add `backend/src/test/kotlin/com/smartjobtracker/testsupport/timeline/TimelineEventTestFixtures.kt`
with `createTimelineEventEntity(jobId, id, type, description,
previousStatus, nextStatus, createdAt)` and a fixed
`timelineEventFixtureTimestamp`, mirroring `NoteTestFixtures`. Default
`type` to `TimelineEventType.STATUS_CHANGE` and default
`previousStatus`/`nextStatus` to two different `JobStatus` values, so a
caller who only needs "some persisted event" gets one that already
exercises the structured-status columns.

## Implementation Order

1. Add this plan (already linked from `docs/business/README.md`).
2. Add `V5__create_timeline_events_table.sql`.
3. Add the `timeline` package with `TimelineEvent` and
   `TimelineEventType`.
4. Add `TimelineEventTestFixtures`.
5. Add `TimelineEventPersistenceTest`.
6. Run `npm run backend:test`, then `npm run backend:test:integration`,
   then `npm run backend:verify`, then `npm run verify`.
7. After verification passes, apply the completion rules.

## Verification Plan

Run, in order, per the task file:

```bash
npm run backend:test
npm run backend:test:integration
npm run backend:verify
npm run verify
```

The Flyway test must continue to report no pending migrations, all
existing job/task/note tests must pass unchanged, and the 100 percent
JaCoCo line-and-branch gate must hold.

## Scope Boundaries

- No timeline repository, service, controller, DTO, or endpoint. Those
  are task 019 and beyond.
- No automatic event creation from job status changes; that is task
  019.
- No event mutation or deletion API, ever, per the task file.
- No change to `Job`, `JobService`, `JobController`, or any job DTO.
- No change to `Task` or `Note` and their stacks.
- No frontend integration.
- No authentication or user ownership rules.
- No new dependencies.
- No unrelated formatting or refactors.

## Completion Rules

After implementation and verification pass:

- Tick task 018's acceptance criteria.
- Tick task 018 in `docs/backlog/phase-3-backend-foundation.md`.
- Point "Current Recommended Next Task" in `docs/backlog/README.md` at
  task 019.
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [x] Timeline event schema exists.
- [x] Timeline event entity maps to a job.
- [x] Status events expose machine-readable previous/next statuses and
      dates.
- [x] No event mutation API is introduced.
- [x] `npm run backend:verify` and `npm run verify` pass before task
      completion is marked.

## Verified State

Implemented and verified on the `feat/task-018-create-timeline-event-entity`
branch.

- `V5__create_timeline_events_table.sql` creates the `timeline_events`
  table with the cascading foreign key to `jobs` and
  `idx_timeline_events_job_id`, mirroring the `tasks`/`notes` migrations.
- `com.smartjobtracker.timeline.TimelineEvent` maps the schema, extends
  `AssignedIdEntity`, and is fully immutable (every field `val`) since
  nothing ever edits a recorded event. `TimelineEventType` is a second
  top-level enum in the same file with one constant, `STATUS_CHANGE`,
  matching what task 019 actually needs; adding a future type needs no
  migration since the column is a plain `VARCHAR(50)`.
- `previousStatus`/`nextStatus` reuse the existing `JobStatus` enum as
  nullable columns, giving analytics machine-readable transitions
  instead of a parsed description string.
- `TimelineEventTestFixtures.createTimelineEventEntity` and
  `TimelineEventPersistenceTest` cover the column round trip (including
  both status enums), the cascade on job deletion, and the foreign-key
  rejection for an unknown job. Three tests, mirroring
  `NotePersistenceTest`.
- `npm run backend:test`, `npm run backend:test:integration`,
  `npm run backend:verify`, and `npm run verify` all passed: ktlint,
  detekt, all tests (unit and integration against real PostgreSQL), and
  the 100 percent JaCoCo line-and-branch gate.
