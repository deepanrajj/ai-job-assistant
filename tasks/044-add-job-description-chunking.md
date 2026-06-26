# Task 044 - Add Job Description Chunking

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Split job descriptions into reusable chunks for embeddings and RAG.

## Scope

In scope:

- Add deterministic chunking utility/service behavior.
- Preserve useful text boundaries where practical.
- Store or return chunks through the current backend data model.

Out of scope:

- Embedding generation.
- RAG endpoint.
- Frontend changes.

## Required Changes

- Add chunking logic with constants for chunk size/overlap.
- Add unit tests for empty, short, exact-size, and long descriptions.
- Avoid logging raw descriptions.

## Tests

- Empty input behavior.
- Short input produces one chunk.
- Long input produces ordered chunks.
- Chunk overlap behavior if overlap is introduced.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Job descriptions can be chunked deterministically.
- [ ] Chunking edge cases are tested.
- [ ] No embeddings are generated yet.

## Commit

```text
task-044: add job description chunking
```
