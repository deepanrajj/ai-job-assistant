# Task 038 - Cache AI Outputs Per Job

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`,
and `../docs/context.md` before starting.

## Goal

Avoid unnecessary repeated AI calls by caching saved AI outputs per job.

## Scope

In scope:

- Store AI outputs with a job-specific relationship.
- Reuse cached output when the relevant job content has not changed.
- Make refresh/regenerate behavior explicit.

Out of scope:

- Embeddings or RAG.
- Cross-user shared caches.
- Logging raw AI content.

## Required Changes

- Define the cache source of truth for current data layer.
- Add invalidation rules for changed job descriptions.
- Add tests for cache hit and refresh paths.

## Tests

- Cached analysis is reused.
- Changing job description invalidates or prompts refresh.
- Manual regenerate calls AI again.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI output cache is job-specific.
- [ ] Stale cache behavior is clear.
- [ ] Tests cover hit, invalidation, and refresh.

## Commit

```text
task-038: cache ai outputs per job
```
