# Task 040 - Add Basic AI Request Logging Without Sensitive Raw Content

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Add safe AI request logging for observability.

## Scope

In scope:

- Log non-sensitive request metadata.
- Include operation type, success/failure, duration, and safe error
  category where available.

Out of scope:

- Raw job descriptions.
- Raw prompts.
- Full provider responses.
- External observability services.

## Required Changes

- Add logging at the AI service/client boundary.
- Keep logs useful for debugging without exposing private content.
- Add tests only where log behavior is practical to verify.

## Tests

- Verify no raw description/prompt is passed to the logger in covered
  code paths if a testable logging seam is introduced.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] AI calls produce safe metadata logs.
- [ ] Sensitive raw content is not logged.
- [ ] Backend verification passes.

## Commit

```text
task-040: add basic ai request logging without sensitive raw content
```
