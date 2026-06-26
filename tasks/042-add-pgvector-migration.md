# Task 042 - Add pgvector Migration

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Prepare PostgreSQL for vector search with pgvector.

## Scope

In scope:

- Add a Flyway migration that enables pgvector.
- Update local database setup if the image or extension support needs
  configuration.

Out of scope:

- Job chunk table.
- Embedding generation.
- RAG endpoint.

## Required Changes

- Use a migration for extension setup.
- Document any local PostgreSQL image requirement.
- Do not assume production extension availability without documenting
  it.

## Tests

- Verify migration runs locally.
- Add integration coverage if database tests are available.

## Validation

Run `npm run backend:verify` and any local DB migration check.

## Acceptance Criteria

- [ ] pgvector extension setup is migrated.
- [ ] Local runtime supports the extension.
- [ ] No RAG behavior is added yet.

## Commit

```text
task-042: add pgvector migration
```
