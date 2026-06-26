# Task 045 - Add Embeddings Generation

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Generate embeddings for job description chunks.

## Scope

In scope:

- Add an embedding provider call through the backend AI boundary.
- Store embeddings on job chunks.
- Handle provider failures with typed API errors or retry-safe behavior.

Out of scope:

- RAG ask endpoint.
- Frontend UI.
- Logging raw chunk content.

## Required Changes

- Add provider model/configuration needed for embeddings.
- Add service tests with a fake provider/client.
- Keep embedding generation explicit and testable.

## Tests

- Successful embedding generation updates chunks.
- Provider failure returns/records a safe error.
- Empty chunk lists do not call the provider.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Embeddings can be generated for chunks.
- [ ] Embeddings are persisted.
- [ ] Provider failures are handled safely.

## Commit

```text
task-045: add embeddings generation
```
