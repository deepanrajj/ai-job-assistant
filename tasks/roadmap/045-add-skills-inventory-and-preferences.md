# Task 045 - Add Skills Inventory And Preferences

Status: In progress - frontend complete behind a feature flag, backend pending

Progress is tracked in the
[plan](../../docs/business/045-add-skills-inventory-and-preferences-plan.md#progress).

- [ ] **Remove the temporary preferences mock and feature flag once the
  backend lands.** Delete `frontend/src/services/preferences/preferences.mock.ts`
  and its test, the `USE_MOCK_PREFERENCES` branches and import in
  `preferences.service.ts`, and `PREFERENCES_FEATURE_ENABLED` with the
  places that read it. Until then built images hide the section, and the
  mock runs only in the Vite dev server.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Capture user skills and job preferences for matching and discovery workflows.

## Scope

In scope:

- Add skills inventory to Profile.
- Add preferences for roles, locations, work mode, seniority, and target keywords.
- Make data reusable by Discover and later AI features.

Out of scope:

- AI matching.
- External job search provider integration.
- Complex skill taxonomy.

## Required Changes

- Add profile preference model support.
- Create accessible editing UI.
- Use normalized lists for skills and keywords.

## Tests

- Skills can be added and removed.
- Preferences are saved and displayed.
- Empty preferences render cleanly.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Skills inventory exists.
- [ ] Job preferences exist.
- [ ] Data is available for later Discover and AI workflows.

## Commit

```text
task-045: add skills inventory and preferences
```
