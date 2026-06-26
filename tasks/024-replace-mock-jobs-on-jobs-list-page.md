# Task 024 - Replace Mock Jobs On Jobs List Page

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Load the jobs list page from backend APIs instead of mock/local data.

## Scope

In scope:

- Fetch jobs for the jobs list route.
- Preserve search, filter, sort, pagination, and table behavior.
- Show existing loading and error UI patterns.

Out of scope:

- Dashboard integration.
- Create/edit/delete integration.
- Adding a new data-fetching library.

## Required Changes

- Replace the jobs list data source with the job service.
- Keep accessibility behavior of the table unchanged.
- Add page/component tests for loading, success, and error states.

## Tests

- Jobs render from API data.
- Loading state appears.
- Error state appears.
- Search/filter behavior still works.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Jobs list uses backend data.
- [ ] Existing table behavior is preserved.
- [ ] Tests cover user-visible states.

## Commit

```text
task-024: replace mock jobs on jobs list page
```
