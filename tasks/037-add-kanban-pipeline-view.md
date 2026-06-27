# Task 037 - Add Kanban Pipeline View

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Let users scan saved jobs by application status in a Kanban pipeline.

## Scope

In scope:

- Add a Jobs pipeline view grouped by status.
- Reuse existing job status values.
- Allow navigation from a Kanban card to job detail.

Out of scope:

- Drag-and-drop status updates unless explicitly added later.
- Backend persistence changes.
- New job statuses.

## Required Changes

- Add a view switch between list/table and pipeline if needed.
- Create accessible columns and job cards.
- Keep mobile layout usable.

## Tests

- Jobs are grouped by status.
- Empty columns render clearly.
- Cards link to the correct job detail page.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Kanban view exists for saved jobs.
- [ ] All statuses are represented.
- [ ] Keyboard users can navigate job cards.

## Commit

```text
task-037: add kanban pipeline view
```
