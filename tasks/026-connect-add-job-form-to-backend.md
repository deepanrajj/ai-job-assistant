# Task 026 - Connect Add Job Form To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Create new jobs through the backend API from `/jobs/new`.

## Scope

In scope:

- Submit validated job form values to the job service.
- Navigate to the appropriate page after successful creation.
- Show API errors without losing user input.

Out of scope:

- Edit job integration.
- Authentication.
- Backend contract changes.

## Required Changes

- Replace local create behavior on the new job page.
- Reuse the existing form schema and UI.
- Add tests for success and API error behavior.

## Tests

- Successful submit calls create API and navigates.
- Validation still blocks invalid submits.
- API error is shown accessibly.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] New jobs are created through the backend.
- [ ] Form validation remains intact.
- [ ] API errors preserve entered values.

## Commit

```text
task-026: connect add job form to backend
```
