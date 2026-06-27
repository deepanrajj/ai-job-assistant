# Task 045 - Add Skills Inventory And Preferences

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

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
