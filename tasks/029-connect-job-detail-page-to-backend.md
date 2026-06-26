# Task 029 - Connect Job Detail Page To Backend

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Load job detail data from the backend API.

## Scope

In scope:

- Fetch job detail by route id.
- Render overview, metadata, status, and saved detail data from the API.
- Handle loading, error, and not-found states.

Out of scope:

- Tasks tab mutation integration.
- Notes tab mutation integration.
- Timeline backend integration unless job detail response already
  includes it.

## Required Changes

- Replace local job detail lookup with job service data.
- Preserve tab accessibility and existing layout.
- Add route/page tests.

## Tests

- Detail page renders API job data.
- Loading state renders.
- Missing job/error state renders.
- Tabs remain keyboard accessible.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Job detail uses backend data.
- [ ] Missing jobs are handled clearly.
- [ ] Existing tab behavior is preserved.

## Commit

```text
task-029: connect job detail page to backend
```
