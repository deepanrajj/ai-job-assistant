# Task 055 - Add Stripe Checkout And Customer Portal

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Let exhausted users start and manage a paid AI subscription through Stripe test mode.

## Scope

In scope:

- Add backend Stripe checkout-session endpoint.
- Add backend customer-portal endpoint.
- Add frontend upgrade actions that call those endpoints.

Out of scope:

- Webhook entitlement sync if deferred to Task 056.
- Production Stripe rollout.
- Multiple pricing tiers.

## Required Changes

- Add Stripe configuration using environment variables.
- Add `POST /api/billing/checkout-session` and `POST /api/billing/customer-portal`.
- Redirect users to returned Stripe URLs.

## Tests

- Checkout endpoint creates a session for authenticated user.
- Portal endpoint requires a known Stripe customer.
- Frontend upgrade CTA calls checkout endpoint.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Stripe test checkout can be started.
- [ ] Customer portal can be opened for paid users.
- [ ] No Stripe secrets are committed.

## Commit

```text
task-055: add stripe checkout and customer portal
```
