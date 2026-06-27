# Task 067 - Add AI Output Caching For Final Workflows

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Avoid repeated paid AI calls by caching generated outputs for final AI workflows.

## Scope

In scope:

- Cache AI outputs per user/job/profile/operation where applicable.
- Show when cached output is reused.
- Allow explicit regenerate.

Out of scope:

- Cross-user shared caches.
- Vector search caches.
- Caching raw prompts.

## Required Changes

- Define cache keys for final AI operations.
- Store safe structured output JSON.
- Invalidate cache when relevant source data changes.

## Tests

- Cached output is reused.
- Regenerate bypasses cache and consumes AI access according to billing rules.
- Changing source data invalidates relevant cache.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] AI caching reduces repeated calls.
- [ ] Users can regenerate intentionally.
- [ ] Cache respects user ownership.

## Commit

```text
task-067: add ai output caching for final workflows
```
