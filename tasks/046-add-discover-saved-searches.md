# Task 046 - Add Discover Saved Searches

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

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
