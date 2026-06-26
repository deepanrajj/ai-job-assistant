# Task 052 - Add Seed Demo Data

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, `../frontend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Provide demo data suitable for screenshots and walkthroughs.

## Scope

In scope:

- Add realistic sample jobs, tasks, notes, and timeline events.
- Make seed data easy to load in local/demo environments.
- Keep seed data non-sensitive and fictional.

Out of scope:

- Production data import.
- Scraping real job posts.
- Authentication-specific demo accounts unless auth already exists.

## Required Changes

- Choose the seed mechanism that matches the current persistence layer.
- Document how to load/reset demo data.
- Add tests where seed generation has logic.

## Tests

- Seed data loads without breaking app startup.
- Demo data contains jobs with tasks, notes, and timeline events.

## Validation

Run verification for touched layers.

## Acceptance Criteria

- [ ] Demo data can be loaded locally.
- [ ] Demo data is fictional.
- [ ] Docs explain how to use it.

## Commit

```text
task-052: add seed demo data
```
