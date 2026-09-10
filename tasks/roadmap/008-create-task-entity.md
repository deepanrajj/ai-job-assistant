# Task 008 - Create Task Entity

Status: Completed

## Instructions

Read `../../AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md`
before starting.

## Goal

Create the backend persistence model for job preparation tasks.

## Scope

In scope:

- Add a Flyway migration for job tasks.
- Add a Kotlin entity linked to jobs.

Out of scope:

- Task repositories, services, controllers, or endpoints.
- Frontend integration.

## Required Changes

- Map task title, status, due date, timestamps, and job relation.
- Preserve job deletion behavior intentionally.

## Tests

- Add migration/entity coverage if persistence tests exist.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [x] Task schema exists.
- [x] Task entity maps to a job.
- [x] No task API is introduced yet.

## Commit

```text
task-008: create task entity
```
