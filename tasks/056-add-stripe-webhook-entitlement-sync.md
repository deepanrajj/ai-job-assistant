# Task 056 - Add Stripe Webhook Entitlement Sync

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Update paid AI entitlement state from Stripe webhook events.

## Scope

In scope:

- Add `POST /api/billing/stripe-webhook`.
- Verify webhook signatures.
- Handle subscription activated, updated, canceled, and payment failure events.

Out of scope:

- Manual admin billing tools.
- Multiple products or tiers.
- Frontend changes beyond existing paid state display.

## Required Changes

- Store Stripe customer/subscription identifiers safely.
- Make webhook processing idempotent.
- Update AI entitlement paid status from webhook events.

## Tests

- Valid webhook activates paid AI.
- Canceled subscription disables paid AI.
- Duplicate webhook does not corrupt state.
- Invalid signature is rejected.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Stripe webhooks sync paid status.
- [ ] Webhook processing is idempotent.
- [ ] Invalid webhooks are rejected.

## Commit

```text
task-056: add stripe webhook entitlement sync
```
