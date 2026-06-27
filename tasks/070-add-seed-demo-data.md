# Task 070 - Add Seed Demo Data

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Provide demo tracker data for screenshots, walkthroughs, and local testing.

## Scope

In scope:

- Seed realistic jobs, tasks, notes, timeline events, reminders, contacts, documents, and profile data.
- Keep demo data clearly non-sensitive.
- Make seeding easy for local development.

Out of scope:

- Production seed data.
- Real company secrets or personal data.
- AI-generated data at runtime.

## Required Changes

- Add seed data mechanism matching backend persistence setup.
- Document how to load/reset demo data.
- Keep data useful for final navigation areas.

## Tests

- Seed data loads without errors.
- Demo user can view seeded records.
- Reset behavior is documented or tested.

## Validation

Run verification for touched layers.

## Acceptance Criteria

- [ ] Demo data exists.
- [ ] Screenshots can use seeded records.
- [ ] No sensitive data is included.

## Commit

```text
task-070: add seed demo data
```
