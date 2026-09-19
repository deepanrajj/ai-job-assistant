# Task 070 - Add Seed Demo Data

Status: Not started

Related plan: [Product improvements - delivery sequence](../../docs/business/product-improvements-and-recommendations-plan.md#delivery-sequence).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Provide job demo data for screenshots, walkthroughs, and local testing
without waiting for unfinished domain models.

## Scope

In scope:

- Seed synthetic jobs across the supported statuses using the existing
  job schema. Include sparse optional fields and realistic descriptions.
- Keep demo data clearly non-sensitive.
- Make seeding easy for local development.

Out of scope:

- Production seed data.
- Real company secrets or personal data.
- AI-generated data at runtime.
- Tasks, notes, timeline, reminders, contacts, documents, and profiles:
  follow-up R-12 adds those scenarios after their persistence exists.
- Creating authentication/demo-user infrastructure before tasks 051/052.

## Dependencies And Scheduling

Job persistence and CRUD must exist (tasks 001-007). Run this task early
alongside the first browser-journey milestone, one task at a time; it does
not depend on the rest of phase 5 or phase 7. Task 080 must still manage
its own isolated test records rather than depend on mutable demo data.

## Required Changes

- Add seed data mechanism matching backend persistence setup.
- Document how to load/reset demo data.
- Keep data useful for the current jobs list, detail, and dashboard.
- Make seeding explicitly opt-in for local/demo use and safe to repeat.
  Identify seed-owned rows so reset cannot delete user-entered jobs.
  Extend this mechanism for ownership when authentication lands.

## Tests

- Seed data loads without errors.
- Seeded records appear through the existing job API and screens.
- Repeated seeding creates no duplicates; resetting demo rows preserves
  user-entered rows. Seed behavior is disabled outside its local/demo mode.

## Validation

Run verification for touched layers.

## Acceptance Criteria

- [ ] Demo data exists.
- [ ] Screenshots can use seeded records.
- [ ] No sensitive data is included.
- [ ] Repeated load/reset is safe and requires no unfinished domain schema.

## Commit

```text
task-070: add seed demo data
```
