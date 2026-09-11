# Task 023 - Add Typed API Response Models

Status: Completed

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`,
and `../../docs/context.md` before starting.

## Known Before Starting

Task 020 added `TJobResponse`, the wire type for `/api/jobs`, and
verified it against a running backend. It found three differences from
the UI model `TJob` that this task has to resolve. They are recorded in
[the task 020 plan](../../docs/business/020-add-job-service-plan.md):

- `JobResponse` has **no `tags` and no `nextStep`**. `TJob` requires
  `tags: string[]`. What happens to those two fields is an open product
  question, not just a mapping one.
- Empty values arrive as JSON `null`, not omitted, so `TJobResponse`
  uses `string | null` where `TJob` uses `string?`.
- Unknown request fields are silently ignored by the backend, so sending
  `tags` returns 201 and drops them. A mapper that invents them will not
  fail any test that mocks the API client.

## Goal

Align frontend API types with backend job tracker response contracts.

## Scope

In scope:

- Add or refine frontend types for backend job, task, note, and timeline
  responses.
- Add mapper utilities only when backend wire models differ from UI
  models.

Out of scope:

- Backend endpoint changes.
- Replacing UI data sources.

## Required Changes

- Keep wire types and UI/domain types clear.
- Add tests for mapping utilities if introduced.
- Avoid duplicating types that already match existing domain models.

## Tests

- Mapper tests for date/status/nullable field conversion if needed.
- Type-level behavior should be covered through service tests where
  practical.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [x] API response models are typed.
- [x] UI models remain stable.
- [x] Mapping behavior is tested when non-trivial.

`TJob` did change: `tags` and `nextStep` were removed, with product
sign-off, because the backend has neither and the locked persistence
model in `docs/context.md` section 5 never had them. The second
criterion is therefore read as "changes once, here, rather than drifting
across tasks 024 to 029". See
[the plan](../../docs/business/023-add-typed-api-response-models-plan.md)
for the rejected alternatives.

## Commit

```text
task-023: add typed api response models
```
