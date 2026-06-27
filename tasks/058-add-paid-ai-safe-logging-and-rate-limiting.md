# Task 058 - Add Paid AI Safe Logging And Rate Limiting

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Add production-minded protection and observability for paid AI endpoints.

## Scope

In scope:

- Log safe AI usage metadata without raw prompts, resumes, CVs, or job descriptions.
- Rate-limit AI endpoints by authenticated user.
- Keep limits configurable.

Out of scope:

- External observability services.
- Distributed rate limiting unless needed by deployment.
- Logging provider responses.

## Required Changes

- Add AI usage event logging at the service boundary.
- Add AI endpoint rate limiter.
- Return consistent API errors when rate limits are exceeded.

## Tests

- Safe metadata is recorded for AI calls.
- Raw sensitive content is not logged.
- Requests over the limit are rejected.
- Non-AI endpoints are unaffected.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] AI usage logging is safe.
- [ ] AI endpoints are rate-limited.
- [ ] Configuration controls limits.

## Commit

```text
task-058: add paid ai safe logging and rate limiting
```
