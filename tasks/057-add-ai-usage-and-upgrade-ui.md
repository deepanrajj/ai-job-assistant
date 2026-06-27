# Task 057 - Add AI Usage And Upgrade UI

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Show AI credit and paid access state in AI workflows.

## Scope

In scope:

- Fetch AI usage state from billing endpoint.
- Show remaining free credits near AI actions.
- Show upgrade CTA when credits are exhausted.

Out of scope:

- Implementing Stripe backend endpoints.
- Pricing page design.
- Changing non-AI workflows.

## Required Changes

- Add frontend billing service/hook.
- Handle `402 AI_PAYMENT_REQUIRED` responses from AI actions.
- Keep non-AI tracker behavior unaffected.

## Tests

- Remaining credits render.
- Exhausted state shows upgrade CTA.
- `402` response displays payment-required message.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Users can see AI credit state.
- [ ] Exhausted users see upgrade path.
- [ ] Paid state allows AI UI to continue.

## Commit

```text
task-057: add ai usage and upgrade ui
```
