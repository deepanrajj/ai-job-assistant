# Task 019 - Track Timeline Events When Job Status Changes

Status: Not started

Related plan: [Product improvements - analytics history](../../docs/business/product-improvements-and-recommendations-plan.md#analytics-must-use-history).

## Instructions

Read `../../AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md`
before starting.

## Goal

Record timeline events when a job status changes.

## Scope

In scope:

- Add timeline event creation to job status update behavior.
- Add read support needed to display a job timeline from backend data.
- Preserve append-only event history.
- Provide a bounded, paginated cross-job history read for the dashboard,
  alongside job-detail reads, so consumers need no request per job.

Out of scope:

- Frontend integration.
- Editing or deleting timeline events.
- Events for every job field change unless explicitly needed.
- Historical application-date entry and employer-response recording
  (follow-up R-11 in the related plan).

## Required Changes

- Update job service behavior to detect status changes.
- Persist a timeline event with clear user-facing text.
- Save previous status, next status, and the transition's recorded time
  in the same transaction as the job update. A failed event write must
  roll back the status update.
- Return structured event data in the read contract. Define a capped
  page size, stable ordering/tie-breaker, and pagination metadata for
  cross-job history; document the API for tasks 032 and 043.
- Do not manufacture earlier transitions for jobs created/imported in
  APPLIED, INTERVIEW, or OFFER. Their prior history is unknown.
- Add tests for status-change and no-change cases.

## Tests

- Status change creates one timeline event.
- Updating a job without status change does not create a status event.
- Missing job behavior still returns the expected error.
- Event-write failure rolls back the associated status change.
- Paginated history preserves ordering and includes structured statuses;
  equal timestamps do not lose events across pages.
- Creating a job with an advanced status does not invent past events.

## Validation

Run `npm run backend:test`, `npm run backend:test:integration`,
`npm run backend:verify`, then `npm run verify`. Run the working-tree API
collection checks required by AGENTS.md for changed job contracts.

## Acceptance Criteria

- [ ] Status changes create timeline events.
- [ ] Timeline reads return persisted events.
- [ ] Job update and event creation are atomic.
- [ ] A documented paginated history contract supports dashboard reads.
- [ ] Backend verification passes.

## Commit

```text
task-019: track timeline events when job status changes
```
