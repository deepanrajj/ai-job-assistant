# Phase 6: Authentication And AI Billing Foundation

Goal: make tracker data user-owned and prepare AI features to become paid
after free tries.

## Product Rules

- Each signed-in user receives 10 one-time free AI credits.
- Each successful AI operation consumes 1 credit.
- Validation failures and failed OpenAI/provider calls do not consume
  credits.
- After credits are exhausted, unpaid users receive
  `402 AI_PAYMENT_REQUIRED`.
- Stripe test mode is the billing provider for checkout, customer portal,
  and subscription webhooks.

## Tasks

- [ ] [Add authentication](../../tasks/051-add-authentication.md).
- [ ] [Add user specific jobs](../../tasks/052-add-user-specific-jobs.md).
- [ ] [Add AI usage entitlement model](../../tasks/053-add-ai-usage-entitlement-model.md).
- [ ] [Add free AI credit gate](../../tasks/054-add-free-ai-credit-gate.md).
- [ ] [Add Stripe checkout and customer portal](../../tasks/055-add-stripe-checkout-and-customer-portal.md).
- [ ] [Add Stripe webhook entitlement sync](../../tasks/056-add-stripe-webhook-entitlement-sync.md).
- [ ] [Add AI usage and upgrade UI](../../tasks/057-add-ai-usage-and-upgrade-ui.md).
- [ ] [Add paid AI safe logging and rate limiting](../../tasks/058-add-paid-ai-safe-logging-and-rate-limiting.md).

## Acceptance Criteria

- Jobs and tracker data are scoped to authenticated users.
- AI calls require remaining free credits or active paid access.
- Stripe test-mode checkout and webhooks can activate paid AI access.
- The frontend shows remaining credits and an upgrade path.
