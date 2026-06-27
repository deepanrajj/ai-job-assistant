# Task 042 - Add Calendar View

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Show interviews, deadlines, follow-ups, and task due dates in one calendar-oriented view.

## Scope

In scope:

- Add Calendar page using existing task/reminder/document dates.
- Group events by date.
- Link calendar items back to job detail.

Out of scope:

- External calendar sync.
- Recurring events.
- Timezone-heavy scheduling logic.

## Required Changes

- Create a responsive calendar/list hybrid view.
- Add empty and loading states if data is asynchronous.
- Update route tests and translations.

## Tests

- Calendar groups events by date.
- Items link to the correct job.
- Empty state renders when no events exist.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Calendar route exists.
- [ ] Relevant dated job events are visible.
- [ ] The view works on mobile.

## Commit

```text
task-042: add calendar view
```
