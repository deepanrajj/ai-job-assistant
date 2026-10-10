# Task 046 - Add Discover Saved Searches

Status: In progress - frontend complete behind a feature flag, backend pending

Progress is tracked in the
[plan](../../docs/business/046-add-discover-saved-searches-plan.md#progress).

- [ ] **Remove the temporary saved search mock and feature flag once the
  backend lands.** Delete `frontend/src/services/savedSearches/savedSearches.mock.ts`
  and its tests, the `USE_MOCK_SAVED_SEARCHES` branches and import in
  `savedSearches.service.ts`, and `SAVED_SEARCHES_FEATURE_ENABLED` with
  the places that read it. Until then built images keep Discover on
  "coming soon", and the mock runs only in the Vite dev server.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Let users define reusable job search criteria before AI/provider discovery exists.

## Scope

In scope:

- Add Discover page saved searches.
- Track role, location, seniority, skills, work mode, and notes.
- Allow saved searches to seed future import/discovery flows.

Out of scope:

- Calling OpenAI or job providers.
- Scheduling search runs.
- Import candidates.

## Required Changes

- Add saved search model support.
- Create list/create/edit UI.
- Add route and translation coverage.

## Tests

- Saved searches render.
- Create/edit behavior works.
- Empty state explains no searches.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Discover has saved searches.
- [ ] Search criteria are persisted.
- [ ] No AI/provider call is made.

## Commit

```text
task-046: add discover saved searches
```
