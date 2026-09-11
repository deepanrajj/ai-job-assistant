# Bug 003 - Jobs Search Placeholder Still Offers To Search By Skill Plan

Status: Completed

## Purpose

Bring the jobs list search placeholder back in line with the fields the
search actually reads, and leave behind a test that fails the next time
the two drift apart.

The defect is described in
`tasks/bugs/bug-003-jobs-search-placeholder-still-offers-skill.md`. It
is a nit by severity, so the interesting part of this plan is not the
one-word edit. It is deciding what a regression test for a piece of
copy should assert, given that a test which merely repeats the copy
back is a second place to forget it.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/bugs/bug-003-jobs-search-placeholder-still-offers-skill.md`
- `tasks/bugs/README.md`
- `docs/business/023-add-typed-api-response-models-plan.md`
- `docs/business/024-replace-mock-jobs-on-jobs-list-page-plan.md`

## Current State

### The two halves that disagree

`createJobsSearchConfig` in
`frontend/src/features/jobs/jobs.config.tsx` returns one object holding
both halves of the contract:

```ts
getSearchText: (job) =>
  [job.company, job.roleTitle, job.location].filter(Boolean).join(' '),
label: t('jobs.search'),
placeholder: t('jobs.searchPlaceholder'),
```

The first line is the behaviour. The third line is the promise made to
the user about that behaviour, and it is fetched from a JSON file the
compiler never reads as anything but a string.

The two locale strings today:

| File | Line | Value |
| --- | --- | --- |
| `frontend/src/i18n/locales/en.json` | 82 | `Search company, role, location, or skill` |
| `frontend/src/i18n/locales/de.json` | 82 | `Firma, Rolle, Standort oder Skill suchen` |

Both name four fields. `getSearchText` reads three.

### Why nothing caught it

Task 023 dropped `tags` from `TJob` and, with it, the `...job.tags`
spread that used to feed the search text. `tags` was the model's name
for the concept; `skill` was the user-facing word for it. A grep for
`tags` while doing task 023 therefore hit the model, the mapper, and
the fixtures, and missed the sentence that advertised the feature.

TypeScript could not help either. `t('jobs.searchPlaceholder')` is
typed as a string and returns a string. Nothing about the string's
content is in the type system, so removing the field it describes is
invisible to the build.

### What the search text contract really is

`IDataTableSearchConfig<TData>` in
`frontend/src/components/dataTable/dataTable.types.ts` asks for
`getSearchText: (row) => string` and an optional `placeholder`. The
data table filters rows by substring against whatever that function
returns, so the placeholder is the *only* thing telling the user what
the substring is matched against. When it lies, the search looks broken
rather than narrow.

### What the current test asserts

`jobs.config.test.tsx` has one search case. It asserts the label, that
the search text contains the company and the role title, and that an
absent location does not leak `undefined` into the string. It never
looks at `placeholder`, and it runs in English only. The defect is
invisible to it by construction, which is why it survived a green
`frontend:verify` on the task 023 branch.

### Verified before writing this plan

- The two placeholder strings are the only jobs-search copy naming a
  fourth field. A case-insensitive grep for `skill` across
  `frontend/src` returns those two lines plus `ai.requiredSkills` and
  `ai.niceToHaveSkills`, which belong to the analyzer panel and have
  nothing to do with the jobs table.
- No test anywhere asserts the current placeholder text. A grep for
  `Search company` and `Firma, Rolle` across `frontend/src` and `docs`
  hits only the two locale files, so changing the copy breaks nothing
  that exists.
- `translate(key, params, language)` is exported from `../../i18n` and
  is already used by this test file to build an English `t`. Building a
  German one costs a single line, so covering both locales needs no new
  helper, fixture, or provider.

## Decisions

### Decision 1: drop the field from the copy rather than restore tags

This is approach 1 from the bug ticket, and the ticket already frames
approach 2 - reinstating tags so that skill search works again - as a
product decision rather than a defect fix. The task 023 plan removed
`tags` deliberately and with sign-off.

Reinstating it here would mean adding a field to `TJob`, a column to
the wire model, a mapper branch, and a backend column that
`docs/context.md` section 5 does not model. That is a feature arriving
inside a nit, which is exactly the shape `AGENTS.md` section 0 forbids.

So the copy moves to meet the code.

### Decision 2: the German copy drops the field, it is not re-translated

`Firma, Rolle, Standort oder Skill suchen` becomes
`Firma, Rolle oder Standort suchen`.

The German sentence is not a word-for-word translation of the English
one - it puts the verb last, as German does - so the edit is made in
German rather than by translating the new English string. Removing
`Skill` from the list means `Standort` inherits the `oder`, which is
the same three-item list shape the English string now has.

Rejected: leaving German alone until a native speaker reviews it. The
ticket states both locales are affected equally, and a placeholder that
advertises a removed field is wrong in German for the same reason it is
wrong in English. Waiting would leave half the defect open for the sake
of a two-word edit.

### Decision 3: the regression test asserts the exact copy, in both locales

The test asserts `searchConfig.placeholder` equals the full expected
sentence, once per supported language.

Reasoning:

- It fails against the unfixed code. That is the bar
  `tasks/bugs/README.md` sets, and the ticket names this form
  explicitly.
- It fails for the *German* string too. The English string is the one
  everybody reads; German is the one that quietly rots. Pinning both is
  most of the value of the test.
- It is readable by a reviewer with no context. The expected sentence
  is right there next to the fields the same test says the search
  reads.

The cost is real and worth stating: an innocuous copy edit now breaks a
test. That is the intended trade. A placeholder that describes
behaviour is not innocuous copy, and the person editing it should be
made to look at `getSearchText` while they do.

### Decision 4: reject asserting the absence of the word skill

The obvious cheaper test is
`expect(placeholder).not.toContain('skill')`.

Rejected. It pins one word rather than the relationship. It would pass
happily if someone later added `or salary` to the placeholder without
adding salary to the search text, which is the same defect with a
different noun. It also reads as a test about a word rather than a test
about a contract, so the next person to see it fail learns nothing
about why it exists.

### Decision 5: reject deriving the expected placeholder from the fields

The most tempting design is a test that parses the placeholder,
extracts the field names it mentions, and compares that set to the
fields `getSearchText` reads.

Rejected, and it is worth saying why, because it looks like the
principled option. The placeholder is a natural-language sentence in
two languages, with different word order and different field labels
(`Standort` for `location`). Any parser for it is a second
implementation of the copy, written in the test file, which would need
updating whenever the copy changes - the exact cost decision 3 was
criticised for, plus a parser to maintain. It would also have to map
each locale's noun onto a `TJob` property by hand, which is a lookup
table of the same two sentences.

### Decision 6: the same test pins getSearchText to exactly three fields

Asserting the copy alone leaves the other half of the pair unpinned.
Someone could add `job.description` to the search text and no test
would object, and the placeholder would then be wrong in the other
direction - under-promising instead of over-promising.

So the new test also asserts that `getSearchText` returns exactly the
company, role title, and location of a job built with three
distinguishable values, joined by single spaces. Equality, not
`toContain`. The existing case keeps its `toContain` assertions and is
left alone; it covers the absent-location branch, which an equality
assertion on a fully populated job cannot.

## Proposed Change

### Changed files

| File | Change |
| --- | --- |
| `frontend/src/i18n/locales/en.json` | `Search company, role, location, or skill` becomes `Search company, role, or location` |
| `frontend/src/i18n/locales/de.json` | `Firma, Rolle, Standort oder Skill suchen` becomes `Firma, Rolle oder Standort suchen` |
| `frontend/src/features/jobs/jobs.config.test.tsx` | adds the regression case described below |

No production TypeScript changes. `jobs.config.tsx` is already correct;
it is the file the copy drifted away from.

## Tests

### New case in `jobs.config.test.tsx`

One `it` block, named for the contract rather than for the bug:
`describes only the job fields the search reads`.

| Step | Assertion |
| --- | --- |
| build a job with a distinct company, role title, and location | - |
| for each of `supportedLanguages`, build a `t` bound to that language and call `createJobsSearchConfig` | - |
| the search text | equals the three field values joined by single spaces |
| the placeholder | equals the expected sentence for that language |

The two expected sentences live in one `const` keyed by language,
declared beside the test, so the pair a reviewer must compare sits on
adjacent lines.

Iterating `supportedLanguages` rather than listing `en` and `de` means
a third locale added later arrives with a missing key in the
expectation map, which TypeScript reports at build time rather than at
runtime.

### Existing tests

Everything else must pass unchanged. Nothing asserts the placeholder
today, so no existing expectation is touched. If any test needs editing
to accommodate this change, something has gone wrong - see `AGENTS.md`
section 4.

Frontend coverage is unaffected: no production line is added, removed,
or made unreachable.

## Implementation Order

1. Add this plan and link it from `docs/business/README.md`.
2. Write the new test case against the **unfixed** locale files and run
   the single Vitest file. It must fail on the placeholder assertion,
   for English first, reporting the stale sentence. Quote the failure.
   A regression test that passes before the fix proves nothing
   (`tasks/bugs/README.md`).
3. Fix `en.json`. Re-run. The English assertion passes and the German
   one now fails, which proves the loop really visits both locales
   rather than asserting the English string twice.
4. Fix `de.json`. Re-run. Green.
5. Run `npm run frontend:verify`.
6. Close out: tick the ticket, move it to Fixed in
   `tasks/bugs/README.md`, and mark this plan `Completed` with a
   verified-state section.

Step 3 is the one worth not skipping. Fixing both locale files at once
would leave the German half of the test unproven, and an unproven
assertion in a regression test is the same failure mode as a test that
passes before the fix.

## Verification Plan

Narrow loop, while iterating:

```bash
npm --prefix frontend run test -- --run src/features/jobs/jobs.config.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

That is lint, the Prettier check, the coverage run, and the build.
`npm run verify` is not required: no backend file is touched, and
`AGENTS.md` section 3 asks for the app-level check for the app that
changed.

## Scope Boundaries

- No change to `getSearchText` or to any other production behaviour.
- No reinstatement of `tags` or of skill search, in the model, the wire
  types, the mapper, or the backend.
- No other translation key, in either locale, including
  `ai.requiredSkills` and `ai.niceToHaveSkills`.
- No change to `DataTable`, to `JobsPage`, or to the search input
  component.
- No new library, no refactor, no reformatting of the locale files.
- Bug 004, which is open against the same feature, is not touched here.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick every acceptance criterion in the bug file and set its status to
  Fixed.
- Move the entry in `tasks/bugs/README.md` from Open to Fixed.
- Mark this plan `Completed` and add a verified-state section recording
  what changed and what the verification run reported.
- `docs/context.md` needs no update. It does not document placeholder
  copy.

## Acceptance Criteria

- [x] Both placeholders name only company, role, and location.
- [x] A regression test pins the placeholder and the search text
      together, and was seen to fail before the fix.
- [x] The test covers both supported locales, and the German half was
      seen to fail on its own.
- [x] No existing test was weakened or edited to pass.
- [x] `npm run frontend:verify` passes.
- [x] No file is changed outside the two locale files, the test file,
      and this change's documentation trail.

## Verified State

Implemented and verified on the
`fix/bug-003-jobs-search-placeholder-still-offers-skill` branch.

- `en.json` line 82 reads `Search company, role, or location`.
- `de.json` line 82 reads `Firma, Rolle oder Standort suchen`.
- `jobs.config.test.tsx` gained `describes only the job fields the
  search reads`, which loops over `supportedLanguages` and asserts the
  search text and the placeholder together, against the
  `expectedSearchPlaceholders` map declared beside it.
- No production TypeScript file changed, as planned.

Failure observed against the unfixed copy, as `tasks/bugs/README.md`
requires:

```text
FAIL  src/features/jobs/jobs.config.test.tsx > jobs config >
      describes only the job fields the search reads
Expected: "Search company, role, or location"
Received: "Search company, role, location, or skill"
```

After fixing `en.json` alone, the same test failed on the German
string, which is what proves the loop visits both locales rather than
checking English twice:

```text
Expected: "Firma, Rolle oder Standort suchen"
Received: "Firma, Rolle, Standort oder Skill suchen"
```

With both locale files fixed, `npm run frontend:verify` passed: ESLint
clean, Prettier clean, 109 test files and 250 tests passing, coverage
at 100 per cent of lines and functions, and the production build
succeeded.

Two notes for future readers.

The reason this defect reached main is that the model's word for the
concept (`tags`) and the user's word for it (`skill`) were different,
so the grep that found every code reference found no copy reference.
When a task removes a user-facing capability, grep the locale files for
the *user's* word for it, not the identifier's.

The first `frontend:verify` run on this branch failed Prettier on
eleven files this change never touched, all of them files the pull of
task 024 had just materialized. That is the CRLF trap recorded in
`docs/engineering/local-runtime-environment.md`: `core.autocrlf` is
`true` here, so any file git writes arrives with CRLF endings that
Prettier rejects. The documented workaround applied unchanged - run
`npm run frontend:format`, verify, then `git checkout --` the files
that are not part of the change so the working tree shows only this
fix.
