# Task 043 - Add Job Chunk Table

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Persist chunks of job content for future semantic search.

## Scope

In scope:

- Add a Flyway migration for job chunks.
- Add entity/repository support if persistence conventions exist.
- Link chunks to jobs.

Out of scope:

- Chunk generation.
- Embedding generation.
- RAG endpoint.

## Required Changes

- Store chunk text, chunk index, optional embedding field if pgvector is
  already available, and timestamps.
- Keep the schema compatible with future embedding generation.

## Tests

- Verify schema/entity behavior where persistence tests exist.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job chunks can be persisted.
- [ ] Chunks are linked to jobs.
- [ ] No RAG query behavior is added yet.

## Commit

```text
task-043: add job chunk table
```
