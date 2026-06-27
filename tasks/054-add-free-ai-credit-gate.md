# Task 054 - Add Free AI Credit Gate

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Enforce free AI credits before OpenAI calls are made.

## Scope

In scope:

- Gate AI endpoints by authenticated user entitlement.
- Consume 1 credit only after a successful AI operation.
- Return `402` with `AI_PAYMENT_REQUIRED` when credits are exhausted and no active subscription exists.

Out of scope:

- Stripe subscription activation.
- Frontend upgrade UI.
- Charging different credit amounts per feature.

## Required Changes

- Add an AI usage gate around AI service operations.
- Add consistent API error handling for payment-required state.
- Ensure validation/provider failures do not consume credits.

## Tests

- Successful AI call decrements one credit.
- Validation failure does not decrement credits.
- Provider failure does not decrement credits.
- Exhausted unpaid user receives `402`.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] AI calls require credits or paid access.
- [ ] Only successful operations consume credits.
- [ ] `AI_PAYMENT_REQUIRED` is returned consistently.

## Commit

```text
task-054: add free ai credit gate
```
