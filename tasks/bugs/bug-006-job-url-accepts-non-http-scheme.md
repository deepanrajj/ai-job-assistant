# Bug 006 - Job URL Accepts A Non-http(s) Scheme

Status: Open
Severity: nit
Reported: code review of the task 039 (job contacts) branch, PR #56

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`
- `../../frontend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

A saved job's `jobUrl` is rendered as a real, clickable `<a href>` link
on the job detail page (`JobDetailHeader.tsx`), but neither the backend
nor the frontend restrict its scheme. A value such as
`javascript:alert(1)` is accepted by both `CreateJobRequest`/
`UpdateJobRequest` and the frontend's `jobFormSchema.ts`, and would
render as a working link.

## Reproduction

1. Create or edit a job.
2. Set the job URL field to `javascript:alert(1)`.
3. Save. The request succeeds; no validation error is shown.
4. Open the job's detail page. The "Open posting" link is rendered
   with `href="javascript:alert(1)"`.

## Expected And Actual

- Expected: a job URL is rejected, the same way task 039 made a
  contact's `profileUrl` reject anything other than `http://` or
  `https://` (blank is also accepted there).
- Actual: any string up to 2048 characters is accepted and rendered as
  a link with no scheme check.

## Root Cause

- `backend/src/main/kotlin/com/smartjobtracker/jobs/dto/CreateJobRequest.kt`
  and `UpdateJobRequest.kt`: `jobUrl` has only a `@Size` constraint, no
  `@Pattern`.
- `frontend/src/features/jobs/jobFormSchema.ts`'s `isOptionalUrl`
  accepts anything `new URL(value)` parses without throwing, and the
  WHATWG `URL` constructor accepts `javascript:` as a valid URL.

## Impact

- Pre-existing since task 006 (jobs first shipped with `jobUrl`); not
  introduced by task 039. Task 039 added the equivalent check for
  contacts' `profileUrl` but did not extend it to this older field,
  since doing so touches unrelated, already-shipped job create/update
  code and tests, which is out of scope for a contacts-only branch.
- Low likelihood in practice (this app has no untrusted job-URL import
  path yet), but the risk grows the day one is added, and is identical
  in shape to the risk task 039 closed for contacts.

## Proposed Fix

1. Add an `http(s)`-only `@Pattern` to `jobUrl` on both
   `CreateJobRequest` and `UpdateJobRequest`, matching contacts'
   `PROFILE_URL_PATTERN` (blank/whitespace-only stays valid, since
   `jobUrl` is optional).
2. Tighten `isOptionalUrl` in `jobFormSchema.ts` to also require an
   `http:`/`https:` protocol, matching the frontend's
   `isValidProfileUrl` for contacts.
3. Consider factoring the scheme check into one shared constant/util
   per language (backend: alongside `ContactFieldLimits.kt`'s
   `PROFILE_URL_PATTERN`; frontend: alongside `contacts.utils.ts`'s
   `isValidProfileUrl`), so a third external-link field does not
   re-derive the same regex a third time. Not required for the fix
   itself.

## Scope

In scope:

- The `jobUrl` scheme validation on create and update, backend and
  frontend, and its regression test.

Out of scope:

- No unrelated refactors to `Job`, `JobForm`, or their tests beyond
  what this validation needs.
- No change to `contacts.profileUrl` (already fixed by task 039).
- The shared-constant suggestion in the proposed fix's step 3 is
  optional, not required to close this bug.

## Tests

- Regression test: `CreateJobRequest`/`UpdateJobRequest` (or their
  controller tests) reject `jobUrl: "javascript:alert(1)"` with a
  validation error, and accept `https://example.com` and a blank value.
  Confirm it fails against the unfixed code first.
- A frontend `jobFormSchema.test.ts` (or equivalent) case for the same
  three values.
- Confirm existing job create/update tests pass unchanged.

## Validation

```bash
npm run backend:verify
npm run frontend:verify
npm run verify
```

## Acceptance Criteria

- [ ] `jobUrl` rejects a non-`http(s)` scheme on create and update, on
      both backend and frontend.
- [ ] A regression test covers it and was seen to fail before the fix.
- [ ] Existing tests pass unchanged.
- [ ] Required verification passes.
- [ ] No unrelated files are changed.

## Commit

```text
bug-006: reject non-http(s) job url schemes
```
