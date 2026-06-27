# Task 036 - Add Final Navigation Structure

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Update the frontend navigation to match the final Smart Job Tracker product areas.

## Scope

In scope:

- Add top-level routes/placeholders for Dashboard, Jobs, Discover, Applications, Calendar, and Profile.
- Remove `AI Assistant` from the final top-level navigation while preserving any current development route if still needed.
- Keep existing implemented pages working.

Out of scope:

- Building every new page workflow.
- Removing existing AI backend endpoints.
- Changing persisted data behavior.

## Required Changes

- Update route metadata and app shell navigation.
- Add accessible empty/placeholder pages where a final nav item is not implemented yet.
- Update translations and route tests.

## Tests

- Navigation renders the final product sections.
- Each new route renders an accessible page title.
- Existing routes still load.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Final navigation shape is visible.
- [ ] `AI Assistant` is not a final top-level nav item.
- [ ] Route tests cover the new navigation.

## Commit

```text
task-036: add final navigation structure
```
