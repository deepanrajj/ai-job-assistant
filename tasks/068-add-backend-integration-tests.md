# Task 068 - Add Backend Integration Tests

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Add backend integration tests for persistence, API contracts, auth, and billing-critical flows.

## Scope

In scope:

- Cover representative API flows.
- Include database-backed behavior where infrastructure exists.
- Include auth/billing boundary tests after those features land.

Out of scope:

- End-to-end browser tests.
- Replacing unit tests.
- Testing OpenAI network calls.

## Required Changes

- Add integration test setup.
- Cover success and error API responses.
- Keep tests deterministic.

## Tests

- Integration tests run through Gradle.
- Critical persistence/API flows are covered.
- External providers are mocked/faked.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Backend integration tests exist.
- [ ] They run in the standard verify path.
- [ ] No external network is required.

## Commit

```text
task-068: add backend integration tests
```
