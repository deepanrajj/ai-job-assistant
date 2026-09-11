# Task 023 - Add Typed API Response Models Plan

Status: Completed

## Purpose

Close the gap task 020 opened. That task typed the frontend job service
to the wire and stopped, because `TJobResponse` and `TJob` do not
describe the same thing and reconciling them needed a product decision
nobody had taken.

This task takes that decision, writes the mapper, and leaves tasks 024
and 026 with a job model the backend can actually store.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md` (section 5, the locked persistence model)
- `tasks/roadmap/023-add-typed-api-response-models.md`
- `docs/business/020-add-job-service-plan.md`
- `docs/business/e2e-testing-strategy-plan.md`

## Current State

### The three differences task 020 recorded

Verified against a running backend, not guessed:

| Difference | Consequence |
| --- | --- |
| `JobResponse` has no `tags` and no `nextStep`; `TJob` requires `tags: string[]` | nothing can map one to the other |
| Empty values arrive as JSON `null`, not omitted | `string \| null` on the wire, `string?` in the UI |
| Unknown request fields are silently ignored | posting `tags` returns 201 and drops them |

The third is why this cannot be left to be discovered later. A frontend
that sends `tags` passes every test that mocks the API client and loses
data against the real service.

### What this plan checked that task 020 did not

`tags` and `nextStep` appear **nowhere** in the locked persistence model
in `docs/context.md` section 5, and nowhere in any of the 81 roadmap
task files. `git log -S` places both in the original foundation commit,
`08b7320`, alongside `mockJobs.ts`.

So the backend is not missing two fields. The frontend has two fields
the product plan never had, invented to make mock data look richer.

That reframes the question from "how do we carry these across" to "why
are they here", and it is the reason the decision below goes the way it
does.

### What consumes the two fields today

| File | Uses |
| --- | --- |
| `types/job/job.types.ts` | declares both on `TJob` |
| `types/job/jobDetail.types.ts` | `Omit`s `nextStep`, then redeclares it required |
| `features/jobs/components/JobForm.tsx` | one input each |
| `features/jobs/jobFormSchema.ts` | one Zod field each |
| `features/jobs/jobForm.utils.ts` | defaults, `getTags`, payload |
| `features/jobs/jobs.config.tsx` | tag chips, next-step line, `tags` in search text |
| `features/jobs/components/JobTags.tsx` | the chip component itself |
| `features/jobDetail/components/JobDetailOverviewPanel.tsx` | the whole focus card |
| `features/jobDetail/jobDetail.utils.ts` | a metadata row |
| `features/jobs/jobsStore.utils.ts` | three round-trip sites |
| `data/mockJobs.ts`, `data/mockJobDetails.ts`, `test/mockJobs.ts` | fixtures |
| `i18n/locales/en.json`, `de.json` | seven keys |

## Decisions

### `tags` and `nextStep` are removed from the frontend model

Confirmed with the product owner before this plan was written.

They are not in the locked model, not in the roadmap, and not in the
backend. Keeping them means the UI keeps offering the user two fields
that cannot be saved.

**Rejected: add `tags` and `next_step` columns to the backend.** This is
the option that preserves the most UI, and it is defensible on product
grounds - tags are a normal thing for a job tracker to have. It is
rejected here on process grounds rather than product ones. It amends the
locked persistence model in `docs/context.md` section 5, which
`AGENTS.md` requires explicit approval for, and it is a backend change,
which `tasks/roadmap/023-add-typed-api-response-models.md` puts
explicitly out of scope. If tags return, they return as their own task
with its own migration, and the mapper written here gains two lines.

**Rejected: default them in the mapper and leave the UI alone.**
`tags: []` and `nextStep: undefined` on every read. This is the smallest
diff by a wide margin and keeps this task inside its stated scope. It is
also the precise failure the task 020 plan named as the dangerous one:
the form keeps accepting both fields, the backend keeps answering 201,
and the values are gone after a reload. A silent write loss is worse
than a removed field, because the removed field is visible.

### The removal happens in this task, not in 024 or 026

The task file scopes this to types and mappers, and removing form inputs
and table cells is plainly more than that. It still belongs here,
because the change is atomic and TypeScript makes it so.

`tags` is a required property of `TJob`. The moment it leaves the type,
every one of the sites in the table above stops compiling. There is no
intermediate state where the mapper exists and the UI has not been
updated, so there is no way to split this across two commits that both
build.

The alternative is to leave `TJob` alone and have the mapper return
something narrower, but then the mapper does not return `TJob`, and
tasks 024 and 026 cannot use it. That defeats the task.

Recorded here rather than silently absorbed, because a reviewer
comparing the diff against the task file will otherwise read it as scope
drift.

### Only job wire types this task; task, note and timeline are deferred

The task file lists "backend job, task, note, and timeline responses".
Only the job half is written.

The backend has no task, note, or timeline endpoint. `Task` has an
entity and a repository from tasks 008 and 009 and nothing above them;
notes and timeline events do not exist at all. Tasks 010 to 019 build
them.

Typing a response that no endpoint returns means inventing a contract
and then discovering in task 011 that it was wrong. Task 020 earned its
keep precisely by checking the contract against a running backend
instead of reading the DTO, and there is nothing here to check against.

Each of those types belongs to the task that first has an endpoint to
verify it against. Noted in Scope Boundaries so the acceptance criteria
are read against what the backend can actually support today.

### The mapper lives in `jobs.utils.ts`, not a new `jobs.mappers.ts`

`src/services/ai/` and `src/services/api/` both use a single
`<name>.utils.ts`, and there is no `.mappers.ts` anywhere in the
frontend. A new file kind for two functions is a new convention for
everyone to learn.

`jobs.utils.ts` currently holds only `getJobFallbackErrorMessage` and is
not exported from the folder barrel. It gains the mappers and the barrel
gains the file, because tasks 024 and 026 import from `../../services`.

### Both directions are written now

`mapJobResponseToJob` for reads, and `mapJobToCreateRequest` and
`mapJobToUpdateRequest` for writes.

The write direction has the same `null` versus `undefined` mismatch as
the read direction, inverted. It is one decision about one boundary, and
writing half of it now means task 026 re-derives the other half inside a
form submit handler, which is the business-logic-in-JSX that
`frontend/AGENTS.md` section 3 warns against.

**Rejected: read mapper only, per the letter of "add mapper utilities
only when backend wire models differ".** The models differ on write too.
The rule is about not inventing mappers for models that already match,
not about mapping in one direction.

### `undefined` maps to `null` on write, and `null` to `undefined` on read

The UI model uses optional properties. The wire uses explicit nulls.
`TUpdateJobRequest` requires every field, so clearing a field means
sending `null`, not omitting it.

**Rejected: omitting the key on write.** The backend's `UpdateJobRequest`
gives no field a default, so an omitted key would be a validation
failure or a silent retention of the old value depending on Jackson's
mood. Sending `null` explicitly says what is meant.

### The focus card on the job detail overview is removed, not left empty

`JobDetailOverviewPanel` renders a two-column grid: a description card
and a focus card holding `nextStep` and the tag chips. With both gone
the second card has a heading and nothing under it.

The grid collapses to the description card alone. This is a visible
layout change and it is the one place where the removal is not purely
subtractive, so it is called out for review rather than buried.

## Proposed Change

### Types

`src/types/job/job.types.ts` - remove `tags` and `nextStep` from `TJob`.

`src/types/job/jobDetail.types.ts` - drop `nextStep` from the `Omit`
list and from the redeclared block.

### Mappers

`src/services/jobs/jobs.utils.ts` gains:

```ts
mapJobResponseToJob(response: TJobResponse): TJob
mapJobToCreateRequest(job: TJobFormPayload): TCreateJobRequest
mapJobToUpdateRequest(job: TJobFormPayload): TUpdateJobRequest
```

`TJobFormPayload` is `Omit<TJob, 'id' | 'createdAt' | 'updatedAt'>`,
declared in `jobs.types.ts`. The three server-owned fields are not
things a caller may set, and a create request that accepted an `id`
would invite one to be sent.

`src/services/jobs/index.ts` - export `./jobs.utils`.

### UI removals

| File | Change |
| --- | --- |
| `JobForm.tsx` | drop the two field descriptors |
| `jobFormSchema.ts` | drop both Zod fields |
| `jobForm.utils.ts` | drop both defaults, both payload lines, and `getTags` |
| `jobs.config.tsx` | drop `...job.tags` from search text, the `JobTags` render, and the next-step line |
| `JobTags.tsx`, `JobTags.test.tsx` | delete; nothing else renders chips |
| `JobDetailOverviewPanel.tsx` | delete the focus card, collapse the grid |
| `jobDetail.utils.ts` | drop the `nextStep` metadata row |
| `jobsStore.utils.ts` | drop the three round-trip sites |
| `data/mockJobs.ts`, `data/mockJobDetails.ts`, `test/mockJobs.ts` | drop both fields; rewrite the two `mockJobDetails` strings that interpolate `job.tags[n]` and `job.nextStep!` |
| `en.json`, `de.json` | remove the seven keys |

`getStringList` in `jobsStore.utils.ts` stays. It still serves
`aiInsights.gaps` and `aiInsights.strengths`, so removing the `tags`
caller does not orphan it. Checked rather than assumed, because an
orphaned helper would fail the 100 per cent coverage gate rather than
lint.

## Tests

### New: `src/services/jobs/jobs.utils.test.ts`

- `mapJobResponseToJob` turns every `null` into `undefined`, field by
  field, and leaves populated values untouched.
- The result has no `tags` and no `nextStep` key. Asserted with
  `Object.keys`, not by reading the properties, because reading
  `job.tags` on a type that no longer declares it does not compile and
  therefore cannot fail at runtime.
- `mapJobToCreateRequest` and `mapJobToUpdateRequest` turn every
  `undefined` into `null`.
- Both write mappers emit exactly the keys the backend accepts, and no
  others. This is the assertion that would have caught the task 020
  finding, so it is asserted on key sets rather than on values.
- `getJobFallbackErrorMessage` keeps its existing coverage, which
  currently comes from the service tests.

### Updated

Every test touching the two fields: `jobForm.utils.test.ts`,
`jobFormSchema.test.ts`, `jobs.config.test.tsx`,
`jobsStore.utils.test.ts`, `jobDetail.utils.test.ts`. These change
because the model changed, which `AGENTS.md` section 4 allows; each edit
removes a field that no longer exists rather than weakening an
assertion.

`JobTags.test.tsx` is deleted with its component.

## Implementation Order

Ordered so failures land where they teach something.

1. **`job.types.ts` and `jobDetail.types.ts`.** Remove both fields
   first. Expected failure: `tsc` errors at every site in the Current
   State table. That error list is the checklist for step 2, and it is
   more reliable than the grep that produced the table.
2. **The UI and store sites, following the error list to zero.**
   Expected failure along the way: `jobsStore.utils.ts` will still
   compile after the `TJob` sites are fixed but before
   `createJobDetailFromJob` is, because `TJobDetail` redeclares
   `nextStep` as required and hides the removal behind its own
   declaration. Step 1 removes it there too, which is why both type
   files move together.
3. **Fixtures and translations.** Expected failure if a locale key is
   missed: nothing. Unused keys are silent, so these are checked by
   grep, not by the suite.
4. **`jobs.types.ts`, then the three mappers in `jobs.utils.ts`.**
   Expected failure: a transposed request and response type is a `tsc`
   error, because `TJobResponse` has `id` and the request types do not.
5. **`jobs.utils.test.ts`.** After the mappers, not before. This is new
   code, not a defect; `tasks/bugs/README.md` requires test-first for
   defects.
6. **The barrel.** Last, so nothing is exported before it exists.

## Verification Plan

Focused first, per `AGENTS.md` section 3:

```bash
npm run frontend:test:coverage
```

Then:

```bash
npm run frontend:verify
```

`npm run verify` is not required. Nothing under `backend/` changes, and
a green backend run would be evidence of nothing here.

The honest limit is the same one task 020 recorded: every test in this
task mocks the API client, so the suite cannot confirm the mapper
matches what the backend really sends. Task 026 is the first thing that
puts a real request behind it, and task 080's browser journey is the
first thing that proves a value survives a reload.

## Scope Boundaries

In scope:

- Removing `tags` and `nextStep` from the frontend model and every site
  that reads them.
- Three job mappers, their types, and their tests.
- Translation key removal in both locales.

Out of scope:

- Backend changes of any kind, including adding the two columns.
- Task, note, and timeline wire types. No endpoint exists to verify
  them against; each belongs to the task that builds its endpoint.
- Replacing any UI data source. The localStorage provider still backs
  every screen after this task. Tasks 024 to 029.
- Reading `code` or `fieldErrors` from the error body.
- A data-fetching library.

## Completion Rules

- `npm run frontend:verify` passes.
- Task 023 criteria ticked and status set.
- `docs/backlog/phase-4-frontend-backend-integration.md` updated, with
  the recommended-next-task line moved to 024.
- `docs/business/README.md` links this plan.
- This plan marked `Completed` with a verified-state section.
- No commit or push without being asked.

## Acceptance Criteria

- [ ] API response models are typed.
- [ ] UI models remain stable.
- [ ] Mapping behavior is tested when non-trivial.

The second criterion is the one this task cannot meet as written. `TJob`
changes, deliberately and with product sign-off, so "stable" is read as
"changes once, here, rather than drifting across tasks 024 to 029". Said
plainly rather than ticked quietly.

## Verified State

### What was built

Three mappers in `frontend/src/services/jobs/jobs.utils.ts`, one new
type, and the removal of `tags` and `nextStep` from the frontend model
and every one of the twenty sites that read them. Nothing consumes the
mappers yet; task 024 is the first caller.

### What the verification reported

| Check | Result |
| --- | --- |
| `npm run frontend:verify` | exit 0: lint, format, coverage, build |
| tests | 236 passing across 108 files, 11 of them new |
| coverage of `jobs.utils.ts` | 100 per cent on all four measures |

`npm run verify` was not run. Nothing under `backend/` changed.

### The coverage number moved down, and it is not a regression

| Metric | main | this branch |
| --- | --- | --- |
| statements, all files | 99.60 | 99.61 |
| branches, all files | 98.11 | 98.08 |
| `jobsStore.utils.ts` branches | 90.51 | 90.17 |

Measured on both branches rather than inferred. The dip is arithmetic.
Removing a covered `??` branch from a file that still has uncovered
branches drops numerator and denominator by one each, and `(c-1)/(t-1)`
is below `c/t` whenever `c < t`. The uncovered regions are the same set,
shifted up by the deleted lines. No new uncovered code was introduced,
and the frontend configures no coverage threshold, so nothing gates on
it.

### What the type system could not catch

`tsc` found twenty compile errors and they were the whole checklist for
the production code, exactly as the Implementation Order predicted. It
found none of the eight test failures that followed, because those
tests query rendered text: `getByLabelText('Tags')`, a next-step line in
the jobs table, and four assertions on `mockJobDetails` strings that
interpolated `job.tags[n]`.

Rewriting those fixture strings is the part of this change a reviewer
should read most carefully. The AI insight, note and task fixtures were
built out of `tags` and `nextStep`, so they had to be re-derived from
`roleTitle` and `company` rather than deleted, and four tests assert on
their exact text.

### One deletion that is not subtractive

`JobDetailOverviewPanel` was a two-column grid whose second card held
`nextStep` and the tag chips. It is now a single description card, and
the grid wrapper is gone. This is the one visible layout change in the
task.

### The local environment trap this hit

`npm run frontend:format:check` failed on five files this branch never
touched, and a stashed run proved clean `main` fails it on thirty-three.
That is the documented `core.autocrlf` trap in
`docs/engineering/local-runtime-environment.md`, not a defect in this
change. Resolved as that entry prescribes, with `npm run frontend:format`
from the repository root.
