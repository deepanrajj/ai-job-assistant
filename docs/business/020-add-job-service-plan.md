# Task 020 - Add Frontend Job Service Plan

Status: Completed

## Purpose

Add a typed frontend service for the backend job endpoints: list,
detail, create, update, delete.

Nothing consumes it yet. Tasks 024 to 029 replace the localStorage
provider with it, and this task deliberately stops before that, so the
acceptance criterion "no UI behaviour changes yet" holds literally.

This is also the first time the two halves of the application are
described in one place. Both suites stub the other side, so no test in
this repository has ever compared the frontend's idea of a job with the
backend's. Doing that comparison is most of the value here, and it found
a mismatch before a line was written.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/020-add-job-service.md`
- `tasks/roadmap/023-add-typed-api-response-models.md` (the boundary)
- `docs/business/e2e-testing-strategy-plan.md` (open decision 3)

## Current State

### The ordering decision this task rests on

`docs/business/e2e-testing-strategy-plan.md` open decision 3 asked
whether 020, 023, 024 and 026 should be pulled ahead of 010 to 019.
**Confirmed: they are.** The reasoning in that plan was that three more
backend domains would otherwise be built on an assumption nobody had
checked. The Current Contract section below is that assumption being
checked, and it did not hold.

That decision is now settled and should be recorded in the strategy plan
when this task closes.

### What the frontend already has

`src/services/api/` is a complete JSON client. `requestJson` wraps
`fetch`, converts any non-2xx into an `AppError`, and `parseJsonResponse`
already returns `undefined` for a 204. `getJson`, `postJson`, `putJson`
and `deleteJson` sit on top of it.

Nothing in this task needs to change any of that, which is the point of
"reuse existing `AppError` and API client patterns" in the task file.

`src/services/ai/` is the one existing service and sets the house shape:
a `.service.ts` of thin exported functions, a `.types.ts`, a `.utils.ts`
resolving localized fallback messages through `translate`, and an
`index.ts` barrel.

`TJob` in `src/types/job/job.types.ts` is the UI model. It is consumed by
nineteen files today, all of them fed by `mockJobs` and the localStorage
provider.

### The contract, verified against a running backend

Read from `JobResponse.kt`, then confirmed by calling the live Compose
stack rather than trusting the DTO. A minimal create returned:

```json
{
  "id": "6d58e422-...",
  "company": "Probe Ltd",
  "roleTitle": "Engineer",
  "location": null,
  "status": "WISHLIST",
  "jobUrl": null,
  "salaryMin": null,
  "salaryMax": null,
  "description": null,
  "createdAt": "2026-09-10T18:50:40.881640926Z",
  "updatedAt": "2026-09-10T18:50:40.881640926Z"
}
```

Four findings, each checked rather than assumed:

| Finding | How it was checked |
| --- | --- |
| `JobResponse` has **no `tags`** and **no `nextStep`**; `TJob` requires `tags: string[]` and has `nextStep?` | read the DTO, confirmed absent from a live response |
| Absent values arrive as JSON `null`, not omitted | live response above; there is no Jackson non-null include configured |
| `BigDecimal` salaries serialise as JSON **numbers**; `75500.50` comes back `75500.5` | posted both, read the types back |
| Unknown request fields are **silently ignored**, not rejected | posted `tags` and `nextStep`, got 201 and neither field in the response |

The status enum does match: backend `JobStatus` and frontend `TJobStatus`
carry the same six values in the same spelling.

The error body is `{code, message, fieldErrors[]}`, confirmed by posting
a blank company. The existing `getApiErrorMessage` reads
`error ?? message ?? fallback`, so it picks up `message` and works
today, while `code` and `fieldErrors` go unread.

### Why the fourth finding is the dangerous one

A create that sends `tags` does not fail. It returns 201 and quietly
drops them. So the mismatch cannot be caught by trying it; it has to be
caught by typing. That is the entire argument for this task preceding
the pages that will call it.

## Decisions

### The service is typed to the wire, not to `TJob`

`getJobs` returns `TJobResponse[]`, a type that mirrors `JobResponse`
exactly: nulls where the backend sends nulls, no `tags`, no `nextStep`.

Rejected: returning `TJob`. It is what the pages want, and it would let
task 024 consume the service directly. It is also a lie in two places at
once - it would have to invent `tags: []` for every job and widen
`null` to `undefined` - and the invention would live in a service whose
tests mock `fetch`, where nothing can contradict it.

Rejected: changing `TJob` to match the wire. Nineteen files consume it
and the localStorage provider must keep working until task 029. That is
scope belonging to the integration tasks, not to this one.

So the gap is named and left open. Task 023 closes it: its scope is
exactly "add mapper utilities only when backend wire models differ from
UI models", and this task is the evidence that they do.

### `tags` and `nextStep` are not sent, and not faked

The create and update request types carry only the ten fields the
backend accepts.

Sending them would be worse than not sending them, because the backend
answers 201 either way. A frontend that posts `tags` looks correct in
every test that mocks `fetch` and loses data against the real service.

What happens to those two fields is a product question - drop them,
or add columns to the backend - and it is not this task's to answer.
It gets written down in the plan and raised when task 024 needs it.

### Nulls stay null in the wire type

`TJobResponse` uses `location: string | null`, not `location?: string`.

Rejected: optional properties. They would be wrong in a way TypeScript
cannot catch later: `job.location ?? 'unknown'` behaves identically for
both, so the error surfaces only when something does `'location' in job`
or `Object.keys`. Matching the wire exactly means the mapper in 023 has
one obvious job.

### One `JOB_REQUEST_FAILED` error code, not five

A single new code in `APP_ERROR_CODES`, with a per-operation fallback
message.

Rejected: a code per operation, mirroring `AI_ANALYZE_FAILED` and
`AI_ASK_FAILED`. Those two exist because the UI renders different
recovery text for them. Nothing yet renders anything for job failures,
and five codes that no branch reads would be five untested branches
under a 100 per cent coverage gate.

Rejected: reusing `UNKNOWN`. It is the fallback for errors with no known
origin, and a failed job request has a very well known one.

### Fallback messages go through `translate`, in both locales

Five new keys under `jobs.fallbackError`, added to `en.json` and
`de.json`, resolved by a `getJobFallbackErrorMessage` helper that mirrors
`getAiFallbackErrorMessage` exactly.

Rejected: English string literals in the service. `frontend/AGENTS.md`
requires both locales, and the AI service already established that a
service-layer fallback message is a translated string.

### `deleteJob` returns `Promise<void>`

`parseJsonResponse` already returns `undefined` on a 204, which is what
the backend sends. Verified in `api.utils.ts` rather than assumed.

Rejected: typing it `Promise<TJobResponse>`. It would compile and hand
every caller an `undefined` typed as a job.

## Proposed Change

New files under `src/services/jobs/`, mirroring `src/services/ai/`:

| File | Holds |
| --- | --- |
| `jobs.types.ts` | `TJobResponse`, `TCreateJobRequest`, `TUpdateJobRequest`, the fallback key map |
| `jobs.service.ts` | `getJobs`, `getJobById`, `createJob`, `updateJob`, `deleteJob` |
| `jobs.utils.ts` | `getJobFallbackErrorMessage` |
| `jobs.service.test.ts` | success, error mapping, and request body shape |
| `index.ts` | barrel |

Signatures:

```ts
getJobs(): Promise<TJobResponse[]>
getJobById(id: string): Promise<TJobResponse>
createJob(payload: TCreateJobRequest): Promise<TJobResponse>
updateJob(id: string, payload: TUpdateJobRequest): Promise<TJobResponse>
deleteJob(id: string): Promise<void>
```

Edited files:

- `src/services/index.ts` - export the new barrel.
- `src/types/error/error.types.ts` - add `JOB_REQUEST_FAILED`.
- `src/i18n/locales/en.json` and `de.json` - five fallback messages.

`TUpdateJobRequest` is not `Partial<TCreateJobRequest>`. The backend's
`UpdateJobRequest` gives no field a default and requires `status`, so an
update replaces every editable field. The type says so.

## Tests

`jobs.service.test.ts`, following `ai.service.test.ts` in mocking
`../api` rather than `fetch`. The API client has its own tests; repeating
them here would test the mock.

Per operation:

- the right client function, URL and error mapping
- the request body that goes out, for create and update
- the value that comes back

Two cases the AI service has no equivalent of:

- **`getJobById` and `updateJob` put the id in the path.** Asserted
  explicitly, because a wrong URL is the mistake a mocked client cannot
  otherwise reveal.
- **The id is encoded.** Asserted for all three routes that take one.
  See the review finding below.
- **`deleteJob` returns the client's result unchanged.** Only that.
  Whether a 204 really produces `undefined` is `parseJsonResponse`'s
  behaviour and the API client's tests own it; mocking the client here
  puts it out of reach.

Error normalization is asserted by rejecting the mocked client with an
`AppError` and checking the service lets it through untouched. The
service adds no catch of its own; `requestJson` already normalizes, and
a second layer would be the kind of speculative abstraction
`AGENTS.md` section 0 rules out.

The 100 per cent line and branch gate means every exported function
needs a test. There are five, and no branches in any of them.

## Implementation Order

1. **`error.types.ts` and both locale files.** Smallest, and the service
   will not compile without the error code. Expected failure if a locale
   key is missed: `translate` returns the key itself, so a test asserting
   the message text fails on the raw key string rather than silently
   passing.
2. **`jobs.types.ts`.** Types only; nothing to run yet.
3. **`jobs.service.ts`.** Expected failure at this point is a TypeScript
   error from `requestJson`'s generics if a request type and a response
   type are transposed.
4. **`jobs.service.test.ts`.** Written after the service rather than
   before, because this is not a bug fix; `tasks/bugs/README.md` requires
   test-first for defects, not for new code.
5. **Barrel and `services/index.ts`.** Last, so nothing is exported
   before it exists.

## Verification Plan

Focused first, per `AGENTS.md` section 3, then the app-level run:

```bash
npm run frontend:test:coverage
```

```bash
npm run frontend:verify
```

`npm run verify` is not required. Nothing under `backend/` changes.

The contract claims in this plan were verified against the running stack
before it was written, not after. Nothing in the automated run re-checks
them, because every test here mocks the API client. That is the honest
limit of this task: it makes the frontend's belief about the contract
explicit and testable, and task 026 is the first thing that will put a
real request behind it.

## Scope Boundaries

In scope:

- Five service functions, their types, their tests, one error code, five
  translation keys in two locales.

Out of scope:

- Mapping `TJobResponse` to `TJob`. Task 023.
- Any page, provider, or localStorage change. Tasks 024 to 029.
- Deciding what happens to `tags` and `nextStep`. Recorded here, raised
  at task 024.
- Reading `code` or `fieldErrors` from the error body. The existing
  client reads `message` and that is unchanged here.
- A data-fetching library. `frontend/AGENTS.md` section 5 forbids it and
  the task file repeats the ban.

## Completion Rules

- `npm run frontend:verify` passes.
- Task file criteria ticked, status set.
- `docs/backlog/phase-4-frontend-backend-integration.md` updated.
- `docs/business/README.md` links this plan.
- Open decision 3 in the e2e strategy plan marked settled.
- The `tags` and `nextStep` gap recorded where task 023 will find it.
- No commit or push without being asked.

## Acceptance Criteria

- [x] Job service functions are typed.
- [x] Tests cover success and error paths.
- [x] No UI behavior changes yet.

## Verified State

### What was built

Five files under `frontend/src/services/jobs/`, plus one error code, one
barrel export, and five translation keys in each locale. No existing
behaviour changed: nothing imports the new service yet, which is what
makes the third criterion literally true rather than merely likely.

### What the verification reported

| Check | Result |
| --- | --- |
| `npm run frontend:test:coverage` | 6 new tests pass |
| `npm run frontend:verify` | exit 0, lint, format, coverage and build |
| coverage of the three new source files | 100 per cent statements, branches, functions and lines |

The repository-wide numbers are 99.6 per cent statements and 98.11 per
cent branches. Both are pre-existing shortfalls elsewhere and neither
moved: the new files are at 100 across the board, read from the per-file
report rather than inferred from the totals.

### The type was checked against a real response, not just the DTO

Every test here mocks the API client, so the suite cannot tell whether
`TJobResponse` matches what the backend actually sends. A throwaway
probe closed that gap: it created a job through the running Compose
stack, compared the response's key set against the keys the type
declares, and deleted the job.

| Question | Answer |
| --- | --- |
| keys the type declares but the response omits | none |
| keys the response sends but the type omits | none |
| `salaryMin` runtime type | `number` |
| `location` when unset | `null`, present rather than absent |
| delete response | 204 with a zero-length body |

The probe was deleted afterwards.

### Review findings, and what they changed

**The id was interpolated into the path unencoded.** `getJobEndpoint`
built `` `${JOBS_ENDPOINT}/${id}` ``, which is only safe while the id is a
UUID the server minted. Resolved the way `fetch` resolves a relative URL,
`getJobById('../ai/health')` requests `/api/ai/health`. That endpoint
answers 200, so the service resolves and hands back `{ok: true}` typed as
`TJobResponse`. An id containing `?` or `#` fails the same way, becoming
a query string or a fragment instead of a path segment.

Nothing passes an untrusted id yet, which is why the tests did not catch
it: they all used a UUID. Task 029 wires this to a route param, and
`useParams` returns the decoded value, so `/jobs/..%2Fai%2Fhealth` would
have reached the service as `../ai/health`.

Fixed with `encodeURIComponent`. Four tests were written first and
watched fail against the unfixed code - three cases for `getJobById`,
one covering `updateJob` and `deleteJob` - which is the rule
`tasks/bugs/README.md` sets for defects and is worth applying to a defect
found in review before merge.

**One test claimed more than it checked.** A case named for the 204
contract asserted only that `deleteJob` returns what the mocked client
returned. The real 204 handling is in `parseJsonResponse`, which the mock
puts out of reach, and the API client's own tests cover it. Renamed to
say what it does. The design is unchanged; only the claim was wrong, here
and in the pull request description.

### The finding that justified the ordering

The strategy plan argued for pulling this task forward on the grounds
that nothing had ever proven the two halves could talk. That paid off
before any code was written: `JobResponse` has no `tags` and no
`nextStep`, while `TJob` requires `tags`. Sending them is not an error
either, so the backend answers 201 and silently drops them.

This task does not fix that. It names it, keeps the wire type honest,
and hands it to task 023, whose file now carries a Known Before Starting
section pointing here.
