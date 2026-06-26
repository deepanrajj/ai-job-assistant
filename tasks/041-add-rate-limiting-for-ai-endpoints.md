# Task 041 - Add Rate Limiting For AI Endpoints

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Protect AI endpoints from excessive repeated calls.

## Scope

In scope:

- Add a simple backend rate-limiting strategy for AI endpoints.
- Return a consistent API error when the limit is exceeded.
- Make limits configurable.

Out of scope:

- Full user authentication dependency unless already available.
- Distributed rate limiting.
- Frontend throttling as the only protection.

## Required Changes

- Add a minimal rate-limiting component or interceptor.
- Apply it only to AI endpoints.
- Add tests for allowed and blocked requests.

## Tests

- Requests within the limit succeed.
- Requests over the limit return the expected error response.
- Non-AI endpoints are not affected.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] AI endpoints are rate-limited.
- [ ] Limit behavior is configurable.
- [ ] Tests cover allowed and rejected requests.

## Commit

```text
task-041: add rate limiting for ai endpoints
```
