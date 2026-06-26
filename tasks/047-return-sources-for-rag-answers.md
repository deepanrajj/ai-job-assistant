# Task 047 - Return Sources For RAG Answers

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, `../frontend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Show users which job content supported a RAG answer.

## Scope

In scope:

- Add source metadata to the RAG response.
- Return source type, preview text, and stable identifiers.
- Render sources in the frontend if the RAG UI already exists.

Out of scope:

- Cross-job search.
- Full citation engine.
- Logging raw private content outside the response.

## Required Changes

- Extend the RAG response contract.
- Add tests for source metadata.
- Keep source previews short and user-safe.

## Tests

- Backend returns sources for retrieved context.
- Frontend renders sources accessibly if UI is touched.
- Empty source list behavior is clear.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] RAG answers include source metadata.
- [ ] Source previews are short and useful.
- [ ] Tests cover response and UI behavior.

## Commit

```text
task-047: return sources for rag answers
```
