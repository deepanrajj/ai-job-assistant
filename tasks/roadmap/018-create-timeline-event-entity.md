# Task 018 - Create Timeline Event Entity

Status: Not started

Related plan: [Product improvements - analytics history](../../docs/business/product-improvements-and-recommendations-plan.md#analytics-must-use-history).

## Instructions

Read `../../AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md`
before starting.

## Goal

Create the backend persistence model for job timeline events.

## Scope

In scope:

- Add a Flyway migration for timeline events.
- Add a Kotlin entity linked to jobs.
- Store event type, description, and timestamp.
- For status-change events, store previous and next status as structured
  fields. Other event types may leave them empty; analytics must not
  parse descriptions.

Out of scope:

- Automatic event creation.
- Frontend timeline integration.
- Event editing or deletion.

## Required Changes

- Add schema and entity for timeline events.
- Preserve an event's recorded timestamp independently of job updatedAt;
  do not backfill invented application dates for existing jobs.
- Keep events append-only unless a later task says otherwise.

## Tests

- Add migration/entity coverage if persistence tests exist.
- Verify structured statuses and timestamp round trips against PostgreSQL.

## Validation

Run `npm run backend:test`, `npm run backend:test:integration`,
`npm run backend:verify`, then `npm run verify`.

## Acceptance Criteria

- [ ] Timeline event schema exists.
- [ ] Timeline event entity maps to a job.
- [ ] Status events expose machine-readable previous/next statuses and dates.
- [ ] No event mutation API is introduced.

## Commit

```text
task-018: create timeline event entity
```
