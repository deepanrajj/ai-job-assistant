# Bug <ID> - <Short, Explicit Title>

Status: Open
Severity: P1 | P2 | nit
Reported: <where this came from, e.g. task 009 branch review, CI, manual testing>

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `<app-specific AGENTS.md when editing frontend or backend>`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

What goes wrong, in terms an observer would notice:

- `<observable behaviour>`

## Reproduction

How to see it. Prefer steps someone else can follow without this file's
author present:

1. `<step>`
2. `<step>`

If it cannot be reproduced yet, say so and make reproducing it the first
task of the fix.

## Expected And Actual

- Expected: `<what should happen>`
- Actual: `<what happens instead>`

## Root Cause

The mechanism, not the symptom. Name the code path:

- `<file:line and the reason>`

Write "not yet diagnosed" if unknown. Do not guess.

## Impact

- Who or what is affected, and how badly.
- Whether it is pre-existing or newly introduced, and by what.
- What makes it worse or triggers it more often.

## Proposed Fix

One or more candidate approaches with their trade-offs. Leave the
decision to the implementer unless there is only one sensible option:

1. `<approach and trade-off>`
2. `<approach and trade-off>`

## Scope

In scope:

- `<the defect and its regression test>`

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries unless explicitly listed.
- No behaviour changes beyond correcting this defect.

## Tests

A bug fix needs a test that **fails before the fix and passes after**.
Without one, nothing stops the defect returning.

- Regression test: `<what it asserts>`
- Confirm existing tests still pass unchanged.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Verify the regression test actually fails against the unfixed code
  before fixing. A test that passes either way proves nothing.

## Validation

```bash
npm run frontend:verify
npm run backend:verify
npm run verify
```

Choose the narrowest check while iterating and the appropriate final
check before completion.

## Acceptance Criteria

- [ ] The symptom no longer reproduces.
- [ ] A regression test covers it and was seen to fail before the fix.
- [ ] Existing tests pass unchanged.
- [ ] Required verification passes.
- [ ] No unrelated files are changed.

## Commit

```text
bug-<ID>: <summary>
```
