# Task 040 - Add Reminders

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Support follow-up, interview prep, application deadline, and task due reminders.

## Scope

In scope:

- Add reminder data linked to jobs.
- Show reminders on dashboard and job detail.
- Support date, type, title, and completion state.

Out of scope:

- Push notifications or email reminders.
- External calendar sync.
- Recurring reminders.

## Required Changes

- Create reminder model support.
- Add reminder UI and dashboard next-action display.
- Handle overdue and upcoming states.

## Tests

- Upcoming reminders render.
- Completed reminders are visually distinct or hidden according to the chosen UI.
- Overdue reminders are handled.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Users can track reminders.
- [ ] Dashboard shows next reminders.
- [ ] Reminder behavior is covered by tests.

## Commit

```text
task-040: add reminders
```
