# Task 027 - Connect Edit Job Form To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Load and update existing jobs through the backend API from
`/jobs/:jobId/edit`.

## Scope

In scope:

- Fetch the job being edited.
- Submit validated updates to the backend.
- Handle missing job and API error states.

Out of scope:

- Add job integration.
- Delete job integration.
- Backend contract changes.

## Required Changes

- Replace local edit behavior with job service calls.
- Preserve existing form schema and UI.
- Add tests for loading, success, missing job, and API error behavior.

## Tests

- Existing job values prefill the form.
- Successful submit calls update API and navigates.
- Missing job and API errors render clearly.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Edit page loads from backend.
- [ ] Job updates go through backend.
- [ ] Tests cover visible states.

## Commit

```text
task-027: connect edit job form to backend
```
