# Bug 003 - Jobs Search Placeholder Still Offers To Search By Skill

Status: Fixed
Severity: nit
Reported: found while reading the jobs list search config during task 024 planning

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

The jobs list search box invites the user to search by something the
search no longer looks at:

- Placeholder reads `Search company, role, location, or skill`.
- Typing a skill such as `React` matches nothing, unless the word also
  appears in a company name, role title, or location.

## Reproduction

1. Open the jobs list.
2. Read the placeholder text in the search box.
3. Type a skill that appears in no company, role, or location.
4. The table reports no results while the placeholder says skills are
   searchable.

## Expected And Actual

- Expected: the placeholder names only the fields the search reads.
- Actual: it names a fourth field that was removed.

## Root Cause

Task 023 removed `tags` from the frontend job model, and with it the
spread in the search text builder:

- `frontend/src/features/jobs/jobs.config.tsx:50` now builds the search
  text from `[job.company, job.roleTitle, job.location]`. It previously
  appended `...job.tags`.

The two placeholder strings were not updated alongside it:

- `frontend/src/i18n/locales/en.json:82`
- `frontend/src/i18n/locales/de.json:82`

Newly introduced by task 023, in pull request #21. The compiler could
not catch it: the stale text lives in a JSON string, not in a type.
`skill` was the user-facing word for `tags`, which is why a grep for
`tags` during that task did not surface it either.

## Impact

- Cosmetic and user-facing. Nothing breaks, but the control advertises a
  capability the product does not have, so a user searching for a skill
  concludes the search is broken rather than that the field is gone.
- Affects both locales equally.
- Worse for anyone who used the tags feature before task 023, because
  they have the strongest reason to try it.

## Proposed Fix

1. Drop the trailing field from both placeholder strings, leaving
   `Search company, role, or location` and the German equivalent. One
   word in each of two files, and it matches what the code does.
2. Restore skill search by reinstating tags. Rejected in the task 023
   plan on product grounds, with sign-off; reopening it is a product
   decision, not a bug fix.

Approach 1 unless the product decision changes.

## Scope

In scope:

- The two placeholder strings, and a test that pins the placeholder to
  the fields the search actually reads.

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries unless explicitly listed.
- No behaviour changes beyond correcting this defect.
- Reinstating tags anywhere.

## Tests

A bug fix needs a test that **fails before the fix and passes after**.
Without one, nothing stops the defect returning.

- Regression test: in `jobs.config.test.tsx`, assert the search
  placeholder does not offer a field that `getSearchText` ignores.
  Asserting the exact string is the simplest form and will fail against
  the current copy.
- Confirm existing tests still pass unchanged.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Verify the regression test actually fails against the unfixed code
  before fixing. A test that passes either way proves nothing.

## Validation

```bash
npm run frontend:verify
```

Choose the narrowest check while iterating and the appropriate final
check before completion.

## Acceptance Criteria

- [x] The symptom no longer reproduces.
- [x] A regression test covers it and was seen to fail before the fix.
- [x] Existing tests pass unchanged.
- [x] Required verification passes.
- [x] No unrelated files are changed.

## Commit

```text
bug-003: drop the removed skill field from the jobs search placeholder
```
