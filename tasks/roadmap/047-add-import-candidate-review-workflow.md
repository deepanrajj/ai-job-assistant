# Task 047 - Add Import Candidate Review Workflow

Status: Not started

Related plan: [Product improvements - candidate intake](../../docs/business/product-improvements-and-recommendations-plan.md#non-ai-import-needs-an-intake).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Support reviewing imported job candidates before they become saved jobs.

## Scope

In scope:

- Add imported job candidate model.
- Add manual intake: paste a job description and enter/correct company,
  role, location, and optional source URL before creating a candidate.
- Show candidate list with selected/unselected state.
- Let users review source URL, company, role, location, and description before import.

Out of scope:

- AI job discovery.
- Saving candidates as Jobs; task 049 owns that behavior after task 048
  supplies duplicate classification.
- Provider integrations.
- Automatic text extraction, fetching URLs, CSV parsing, and browser
  extensions. CSV/extension intake is follow-up R-01.

## Required Changes

- Create candidate review UI in Discover.
- Represent candidate source and review status.
- Persist manually entered candidates through the backend. Require
  nonblank company/role/description and validate optional source URLs
  as HTTP(S); source URLs are metadata and must not be fetched.
- Preserve entered values on failure and allow correction before saving
  a candidate. Render descriptions as text, never executable HTML.
- Keep candidates separate from saved jobs until confirmed.

## Tests

- Candidates render separately from saved jobs.
- Selection state works.
- Review page handles empty candidates.
- A user can create and reload a candidate without AI/provider calls.
- Missing required fields, invalid source URLs, and persistence failures
  show useful errors without losing the draft.
- Candidate creation never creates a Job; pasted markup renders as text.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Imported candidates are reviewable.
- [ ] Manual intake supplies persisted candidates without an integration.
- [ ] Candidate intake never creates Jobs; task 049 requires explicit
  confirmation before importing selected candidates.
- [ ] Tests cover candidate review behavior.

## Commit

```text
task-047: add import candidate review workflow
```
