# Task 029 - Connect Job Detail Page To Backend

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, and `../../docs/context.md`
before starting.

## Goal

Load job detail data from the backend API.

## Background

Since task 024 the jobs list renders backend UUIDs while this page still
resolves the route id against the localStorage store, so every row's
details action lands on the not-found state. That was tracked as bug
004 and retired into this task, which fixes it by construction: once
the page fetches by route id, the id spaces agree. Until this task
ships, the list's only row action is dead.

## Scope

In scope:

- Fetch job detail by route id.
- Render overview, metadata, status, and saved detail data from the API.
- Handle loading, error, and not-found states.
- The handoff from the jobs list, so a row reaches the job it shows.

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
- A row's details action on the jobs list opens that job's detail page
  rather than the not-found state. Keep fixture ids UUID-shaped: wire
  fixtures that reuse the `job-001` style ids of the localStorage seed
  data collide with it by coincidence, which is what hid the broken
  handoff during task 024.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Job detail uses backend data.
- [ ] Missing jobs are handled clearly.
- [ ] Existing tab behavior is preserved.
- [ ] A row on the jobs list reaches the job it shows.

## Commit

```text
task-029: connect job detail page to backend
```
