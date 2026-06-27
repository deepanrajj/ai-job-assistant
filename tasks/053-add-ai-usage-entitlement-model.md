# Task 053 - Add AI Usage Entitlement Model

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Create the backend data model for free AI credits and paid AI access.

## Scope

In scope:

- Add AI usage entitlement persistence scoped to user.
- Default new users to 10 one-time free AI credits.
- Represent active paid AI subscription state.

Out of scope:

- Stripe checkout.
- Calling OpenAI through the gate.
- Frontend billing UI.

## Required Changes

- Add Flyway migration and backend model/repository/service support.
- Expose `GET /api/billing/ai-usage` with remaining credits and paid status.
- Avoid storing raw prompts or AI content in usage state.

## Tests

- New user receives 10 free credits.
- Usage endpoint returns credit and paid status.
- Missing entitlement is initialized safely.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] AI entitlement model exists.
- [ ] Free credit default is 10.
- [ ] `GET /api/billing/ai-usage` is available.

## Commit

```text
task-053: add ai usage entitlement model
```
