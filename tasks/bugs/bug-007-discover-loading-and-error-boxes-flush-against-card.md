# Bug 007 - Discover Loading And Error Boxes Sit Flush Against Their Card

Status: Fixed
Severity: nit
Reported: code review of the task 090 (Profile refresh) working tree,
which found the same defect in its new resume library card and traced
it to the Discover pattern it copied

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

On the Discover page, while saved searches or import candidates load,
or after their load fails, the loading box (grey border) or the error
box (red border and tint) touches the card's own border on three sides,
with no gutter: two borders drawn against each other.

## Reproduction

1. Start the dev server and open `/discover` on a slow network (or
   with `/api/saved-searches` or `/api/import-candidates` failing).
2. Look at the "Saved searches" or "Review import candidates" card
   while it loads or after it fails.

## Expected And Actual

- Expected: the loading and error boxes sit inside the card with the
  card's usual 20 px padding, as on every padded card.
- Actual: they fill the card body edge to edge.

## Root Cause

Both cards use `Card padding="none"`, so their rows can run edge to
edge with dividers, and render the shared `LoadingState` and
`ErrorState` straight into that unpadded body. Both states draw their
own `rounded-lg border`, which then meets the card's border:

- `frontend/src/pages/discover/DiscoverPage.tsx`, `renderBody`.
- `frontend/src/features/discover/components/ImportCandidatesSection.tsx`,
  `renderListPlaceholder`.

`EmptyState` has no border, so the empty states were not affected.

## Impact

- Visual only; the states keep their roles, text, and retry.
- Pre-existing since task 087 (the Discover refresh), which made both
  cards unpadded. Task 090 copied the pattern into the Profile library
  card and fixed it there in its own change.

## Proposed Fix

1. Wrap the loading and error states in a `p-5` block inside those
   cards (chosen): local, matches the card padding, touches nothing
   else.
2. Give `LoadingState`/`ErrorState` a borderless variant: a shared API
   change for a two-place visual fix.

## Scope

In scope:

- The two Discover cards and their regression tests.

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries unless explicitly listed.
- No behaviour changes beyond correcting this defect.

## Tests

- Regression tests: `DiscoverPage.test.tsx` and
  `ImportCandidatesSection.test.tsx` ("pads the loading and error boxes
  inside the unpadded card") assert that each state's parent has `p-5`.
  Both were seen to fail against the unfixed code ("Expected the
  element to have class: p-5").
- Existing Discover tests pass unchanged.

## Validation

Focused checks, per `AGENTS.md` §3: the Discover page, feature, and
route tests, ESLint, and Prettier on the changed files. The full suite
is left to CI.

## Acceptance Criteria

- [x] The symptom no longer reproduces.
- [x] A regression test covers it and was seen to fail before the fix.
- [x] Existing tests pass unchanged.
- [x] Required verification passes.
- [x] No unrelated files are changed.

## Commit

```text
bug-007: pad discover loading and error states inside their cards
```
