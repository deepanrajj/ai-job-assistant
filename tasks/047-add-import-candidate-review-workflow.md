# Task 047 - Add Import Candidate Review Workflow

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Support reviewing imported job candidates before they become saved jobs.

## Scope

In scope:

- Add imported job candidate model.
- Show candidate list with selected/unselected state.
- Let users review source URL, company, role, location, and description before import.

Out of scope:

- AI job discovery.
- Bulk import save behavior if deferred to Task 049.
- Provider integrations.

## Required Changes

- Create candidate review UI in Discover.
- Represent candidate source and review status.
- Keep candidates separate from saved jobs until confirmed.

## Tests

- Candidates render separately from saved jobs.
- Selection state works.
- Review page handles empty candidates.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Imported candidates are reviewable.
- [ ] Candidates are not auto-saved.
- [ ] Tests cover candidate review behavior.

## Commit

```text
task-047: add import candidate review workflow
```
