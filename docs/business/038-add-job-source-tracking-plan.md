# Task 038 - Add Job Source Tracking Plan

Status: Completed

## Purpose

Let a user record where a saved job came from - LinkedIn, Indeed,
Xing, a company website, an AI search, a referral, or something else -
and see
that source on the job form and job detail page. The task file scopes
this to storing and displaying the value only: no Discover import
workflow, no analytics beyond showing the stored source, and no
external provider integrations.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/038-add-job-source-tracking.md`

## Current State

### Audited: how `status` (the closest precedent) flows end to end today

| Layer | File | Pattern |
| --- | --- | --- |
| Entity | `backend/.../jobs/Job.kt` | `@Enumerated(EnumType.STRING) @Column(nullable = false) var status: JobStatus` |
| Migration | `backend/.../db/migration/V2__create_jobs_table.sql` | `status VARCHAR(50) NOT NULL` |
| Create/Update DTOs | `backend/.../jobs/dto/CreateJobRequest.kt`, `UpdateJobRequest.kt` | `status: JobStatus? = null` on create (defaults in `toCommand()`), `status: JobStatus?` + `@NotNull` on update |
| Command | `backend/.../jobs/command/JobCommands.kt` | `CreateJobCommand.status` defaults to `JobStatus.WISHLIST`; `UpdateJobCommand.status` required |
| Response | `backend/.../jobs/dto/JobResponse.kt` | plain field, mapped 1:1 from the entity |
| Frontend type | `frontend/src/types/job/job.types.ts` | `TJobStatus` union + `JOB_STATUS_TRANSLATION_KEYS` map |
| Frontend constants | `frontend/src/features/jobs/jobs.constants.ts` | `jobStatusOptions` (`as const satisfies readonly TJobStatus[]`) |
| Form schema | `frontend/src/features/jobs/jobFormSchema.ts` | `status: z.enum(jobStatusOptions)` (required, no empty option) |
| Form defaults/submit | `frontend/src/features/jobs/jobForm.utils.ts` | `status: job?.status ?? 'WISHLIST'` |
| Form field | `frontend/src/features/jobs/components/JobForm.tsx` | `{ name: 'status', type: 'select', options: jobStatusOptions.map(...) }` |
| Wire types | `frontend/src/services/jobs/jobs.types.ts` | `TJobResponse.status: TJobStatus` (never null - always set) |
| Wire mapping | `frontend/src/services/jobs/jobs.utils.ts` | `mapJobResponseToJob` copies it straight through |
| Detail display | `frontend/src/features/jobDetail/components/JobDetailHeader.tsx` | shown via `StatusPill` + an editable `Select`, not the shared metadata `<dl>` |

`status` is **required** everywhere (never null on the wire, defaults
to `WISHLIST` when omitted). Source is different: the task explicitly
says "keep existing jobs compatible with an empty source", so source
must be **optional** everywhere - closer to `location`/`jobUrl`
(`String?`, wire-nullable, `toOptional`/`toNullable` in
`jobs.utils.ts`) than to `status`.

### Verified before writing this plan

**Existing rows survive an additive nullable column with no backfill.**
Read every prior migration (`V1`-`V5`): none add a `NOT NULL` column to
an existing table without a default, and `docs/context.md` section 5
confirms Job persistence is Flyway-versioned with no destructive
rewrites planned. A nullable `ADD COLUMN source VARCHAR(50)` on `jobs`
needs no backfill statement - Postgres fills existing rows with `NULL`
for a nullable column added via `ALTER TABLE`, which is exactly "an
empty source" for pre-existing jobs.

**The select field type already supports an empty-string option.**
Read `components/form/fields/FormSelect.tsx` and `ISelectFieldConfig`
(`form.types.ts`): options are `{ label, value }[]` with `value:
ISelectProps['value']`, no non-empty constraint. `jobs.config.tsx`'s
`createJobsFilters` already renders a `value=""`-shaped option
(`'ALL'`) alongside real enum values in the same `<select>`, so a
`''` = "not specified" option is an established pattern in this
codebase, not a new one.

**`mapJobToJobDetail` widens by spreading `...job` first.** Read
`features/jobs/jobs.utils.ts`: fields not explicitly overridden (like
`status` today) pass through unchanged. An optional `source` on `TJob`
needs no change to `mapJobToJobDetail` or `TJobDetail` to reach the
detail page - it is not one of the fields the mapper widens
(`description`, `jobUrl`, `location`, `salaryMax`, `salaryMin`), so it
stays optional on `TJobDetail` exactly as it is on `TJob`.

**`JobRepositoryTest`/`JobPersistenceTest`/`JobCrudIntegrationTest` all
build jobs through `createJobEntity` in `JobTestFixtures.kt`**, which
supplies a default for every constructor field. Adding a `source`
parameter there with a `null` default keeps every existing call site
compiling unchanged, matching how `JobFieldLimits.kt`-style additions
have been threaded through before.

## Decisions

### Decision 1: `source` is a nullable enum column, not a required one with an `OTHER`/`UNKNOWN` default

`JobSource` is stored the same way `JobStatus` is
(`@Enumerated(EnumType.STRING)`), but the column and every DTO field
are nullable (`JobSource?`), matching `location`/`jobUrl` rather than
`status`. Rejected: giving `CreateJobCommand.source` a default of
`JobSource.OTHER` the way `CreateJobCommand.status` defaults to
`JobStatus.WISHLIST`. The task file's acceptance criteria explicitly
require "no existing job data breaks" for jobs saved before this
column existed; defaulting unset source to `OTHER` would silently
assert a false fact (that an "other" source was recorded) instead of
representing "not recorded" as it actually is.

### Decision 2: one new nullable column via `ADD COLUMN`, not a new migration that also backfills

`V6__add_job_source.sql` adds `source VARCHAR(50)` with no `NOT NULL`
and no `DEFAULT`. Rejected: backfilling existing rows to `'OTHER'`.
Same reasoning as Decision 1 - a backfill would fabricate provenance
data the app never captured, and the task's own "keep existing jobs
compatible with an empty source" line rules it out directly.

### Decision 3: `source` sits next to `status` in field order across every layer

Entity constructor, `CreateJobRequest`/`UpdateJobRequest`,
`CreateJobCommand`/`UpdateJobCommand`, `JobResponse`, and the frontend
`TJob`/`TJobResponse`/`TCreateJobRequest`/`TUpdateJobRequest` all gain
`source` immediately after `status`. Rejected: appending it at the end
of each type. Source is conceptually paired with status/pipeline
tracking (task file: "Track where each saved job came from"), and
keeping the same relative position in every one of these near-identical
field lists makes a future diff between them (e.g. spotting a missed
field) easier to eyeball than an appended field would.

### Decision 4: the job form's source control is a `select` with a "Not set" empty option, not a required enum

`jobFormSchema.ts` gets `source: z.union([z.enum(jobSourceOptions),
z.literal('')])` (optional in effect, always present as a string in
form state) instead of reusing the `status` pattern of
`z.enum(jobStatusOptions)` with no empty choice. `jobForm.utils.ts`
converts the empty string to `undefined` on submit with a new
`getOptionalSource` helper, mirroring `getOptionalText`. Rejected:
`z.enum(jobSourceOptions).optional()` with no explicit empty-string
form value. React Hook Form's uncontrolled `<select>` needs a real
option to represent "nothing chosen" - an `undefined` default renders
as the browser silently selecting the first `<option>` (`LINKEDIN`),
which would make every new job that never touches the source field
report "LinkedIn" instead of "not set". The empty string is a real,
selectable option instead, exactly like `createJobsFilters`'s `'ALL'`
already relies on for the status filter.

### Decision 5: source is shown in the job detail header's existing metadata list, not in the jobs table or Kanban card

`createJobDetailMetadataItems` (`jobDetail.utils.ts`) gets a fourth
item (`location`, `salary`, `updated`, now `source`), rendered through
the same `<dl>` `JobDetailHeader` already has. Rejected: adding an 8th
column to `createJobsColumns` (`jobs.config.tsx`) or a line to
`JobsKanbanCard`. The table is already at 7 columns covering company,
role, status, location, salary, updated, and actions, each with a
`widthClassName` sized to fit; task 037's `JobsKanbanCard` deliberately
keeps its card to three lines (identity, location/salary). The task
file's own wording - "Show source on job list/detail **where
useful**" - and `AGENTS.md`'s "make the smallest change that solves
the task" both point at the one place source is unambiguously useful
(the full detail view) rather than squeezing a sixth data point into
two views already tuned for what they show. Source can be added to the
table or card later as its own scoped task if the product wants it
there.

### Decision 6: no `SourcePill`/badge component

The metadata item's value is the translated label as plain text
(`t(JOB_SOURCE_TRANSLATION_KEYS[job.source])` or `t('jobs.notSet')`),
matching how `location`, `salary`, and `updated` already render as
plain text in the same `<dl>`. Rejected: a colored pill like
`StatusPill`. `StatusPill` exists because status also drives filtering,
Kanban columns, and pill coloring elsewhere; source drives none of
that in this task's scope, so a new visual component for a single
read-only metadata value would be exactly the "speculative
abstraction" `AGENTS.md` rules out.

### Decision 7: `XING` is included beyond the task file's example list

The task file lists "LinkedIn, company website, Indeed, AI search,
referral, and other" as sources "such as", so it is a floor, not a
closed set, and no task file change is needed. Xing is added because
the product targets the German market (task 083 adds German-market job
attributes) and Xing is a primary job board there. Rejected: leaving it
to `OTHER`. Stored values are strings that are costly to rename once
rows exist, and an `OTHER` bucket would hide the one board a German
user is most likely to name. The order (`LINKEDIN`, `INDEED`, `XING`,
`COMPANY_WEBSITE`, `AI_SEARCH`, `REFERRAL`, `OTHER`) groups job boards
first, then direct and derived sources, with `OTHER` last; the
frontend `jobSourceOptions` uses the same order.

## Proposed Change

### Backend (guided - user writes, Claude specs and reviews)

| File | Change |
| --- | --- |
| `backend/src/main/resources/db/migration/V6__alter_jobs_table_add_source.sql` | new: `ALTER TABLE jobs ADD COLUMN source VARCHAR(50);` |
| `backend/.../jobs/Job.kt` | add `enum class JobSource { LINKEDIN, INDEED, XING, COMPANY_WEBSITE, AI_SEARCH, REFERRAL, OTHER }`; add `@Enumerated(EnumType.STRING) var source: JobSource?` to the entity, positioned after `status` |
| `backend/.../jobs/command/JobCommands.kt` | add `source: JobSource? = null` to `CreateJobCommand`, `source: JobSource?` to `UpdateJobCommand`, both after `status` |
| `backend/.../jobs/dto/CreateJobRequest.kt` | add `val source: JobSource? = null` after `status`; pass it through in `toCommand()` |
| `backend/.../jobs/dto/UpdateJobRequest.kt` | add `val source: JobSource?` after `status` (no `@NotNull` - unlike `status`); pass it through in `toCommand()` |
| `backend/.../jobs/dto/JobResponse.kt` | add `val source: JobSource?` after `status`; pass it through in `toResponse()` |
| `backend/.../jobs/JobService.kt` | `createJob` passes `command.source` into the new `Job(...)`; `updateJob` mutates `job.source = command.source` alongside the other field assignments |
| `backend/src/test/.../testsupport/jobs/JobTestFixtures.kt` | add `source: JobSource? = null` param to `createJobEntity`, passed into `Job(...)` |

### Frontend (implemented directly)

| File | Change |
| --- | --- |
| `frontend/src/types/job/job.types.ts` | add `TJobSource` union (`'LINKEDIN' \| 'INDEED' \| 'XING' \| 'COMPANY_WEBSITE' \| 'AI_SEARCH' \| 'REFERRAL' \| 'OTHER'`), `JOB_SOURCE_TRANSLATION_KEYS` map; add `source?: TJobSource` to `TJob` after `status` |
| `frontend/src/features/jobs/jobs.constants.ts` | add `jobSourceOptions` (`as const satisfies readonly TJobSource[]`) |
| `frontend/src/features/jobs/jobFormSchema.ts` | add `source: z.union([z.enum(jobSourceOptions), z.literal('')])` to the schema object |
| `frontend/src/features/jobs/jobForm.utils.ts` | add `getOptionalSource` helper; `createJobFormDefaultValues` gets `source: job?.source ?? ''`; `createJobFormFields` gets `source: getOptionalSource(values.source)` |
| `frontend/src/features/jobs/components/JobForm.tsx` | add a `select` field for `source` (after `status`) with a leading `{ label: t('jobs.notSet'), value: '' }` option plus `jobSourceOptions` |
| `frontend/src/services/jobs/jobs.types.ts` | `TJobResponse.source: TJobSource \| null`; `TCreateJobRequest.source?: TJobSource`; `TUpdateJobRequest.source: TJobSource \| null` |
| `frontend/src/services/jobs/jobs.utils.ts` | `mapJobResponseToJob` adds `source: toOptional(response.source)`; `createJobRequestFields` adds `source: toNullable(job.source)` |
| `frontend/src/features/jobDetail/jobDetail.utils.ts` | `createJobDetailMetadataItems` gets a `source` item |
| `frontend/src/i18n/locales/en.json`, `de.json` | new keys (below) |

### New translation keys (both locales)

- `jobForm.fields.source` - "Source" / "Quelle" (form field label).
- `jobs.source` - "Source" / "Quelle" (detail metadata label; reused
  key, same word, matching how `jobs.location`/`jobs.salary` are
  reused between the table and the detail metadata list).
- `jobSource.linkedin` - "LinkedIn" (same in both locales - a proper
  noun).
- `jobSource.indeed` - "Indeed" (same in both locales - a proper noun).
- `jobSource.xing` - "Xing" (same in both locales - a proper noun).
- `jobSource.companyWebsite` - "Company website" / "Unternehmenswebsite".
- `jobSource.aiSearch` - "AI search" / "KI-Suche".
- `jobSource.referral` - "Referral" / "Empfehlung".
- `jobSource.other` - "Other" / "Sonstiges".

No new key is needed for the empty option - it reuses the existing
`jobs.notSet` key already shown for other unset optional fields.

## Tests

### Backend

- `Job.kt` / `JobPersistenceTest.kt`: persisting a job with a `source`
  round-trips the column; a job persisted with `source = null` still
  round-trips (existing-job compatibility).
- `JobRequestMappingTest.kt` or a new `JobControllerTest` case:
  `POST /api/jobs` with an unknown `source` value returns
  `400 MALFORMED_REQUEST`, mirroring the existing "unknown status
  value" test.
- `JobControllerTest.kt`: creating/updating a job with a `source`
  returns it in the response body and reaches
  `lastCreateCommand.source`/`lastUpdateCommand.source`; omitting
  `source` on create leaves `lastCreateCommand.source` null (no
  default, unlike `status`).
- `JobServiceTest.kt`: `createJob`/`updateJob` carry `command.source`
  onto the saved/mutated entity.

### Frontend

- `jobFormSchema.test.ts`: accepts each `jobSourceOptions` value and
  the empty string; rejects an arbitrary string.
- `jobForm.utils.test.ts`: `createJobFormDefaultValues` defaults an
  absent job source to `''`; `createJobFormFields` converts `''` to
  `undefined` and a real value through unchanged.
- `JobForm.test.tsx`: renders a source `select` with a "Not set" option
  plus the seven source options.
- `jobs.utils.test.ts`: `mapJobResponseToJob` maps a `null` wire
  source to `undefined` and a real value through; `createJobRequestFields`
  (via `mapJobToCreateRequest`/`mapJobToUpdateRequest`) maps an
  `undefined` UI source to wire `null` and a real value through.
- `jobDetail.utils.test.ts`: `createJobDetailMetadataItems` includes a
  translated source value when set, and the `jobs.notSet` fallback
  when absent.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. **Backend (guided):** add `JobSource`, the `source` column on
   `Job.kt`, and `V6__alter_jobs_table_add_source.sql`. Run
   `npm run backend:test:integration` - `JobPersistenceTest` should
   still pass unchanged (source defaults to `null` everywhere so far;
   nothing sets it yet).
3. **Backend (guided):** thread `source` through
   `JobCommands.kt`, `CreateJobRequest.kt`, `UpdateJobRequest.kt`,
   `JobResponse.kt`, `JobService.kt`, and `JobTestFixtures.kt`. Add the
   new controller/service tests. Run `npm run backend:test`, then
   `npm run backend:verify`.
4. **Frontend:** add `TJobSource`/`JOB_SOURCE_TRANSLATION_KEYS` to
   `job.types.ts` and `jobSourceOptions` to `jobs.constants.ts`.
   Nothing consumes them yet.
5. **Frontend:** add the `jobSource.*`/`jobForm.fields.source`/
   `jobs.source` translation keys to both locales.
6. **Frontend:** update `jobFormSchema.ts` and its test - schema
   accepts the new field before anything produces it, so this step's
   test is the only thing exercising it.
7. **Frontend:** update `jobForm.utils.ts` (`getOptionalSource`,
   defaults, submit mapping) and its test.
8. **Frontend:** add the `source` field to `JobForm.tsx` and its test.
   The add/edit job forms now save a source end to end against a mock
   service.
9. **Frontend:** update `services/jobs/jobs.types.ts` and
   `jobs.utils.ts` (wire mapping both directions) and their tests. The
   real API round trip is now typed and mapped.
10. **Frontend:** update `jobDetail.utils.ts` and its test so the
    detail page shows the stored source.
11. `npm run frontend:verify`.
12. Manually verify against a running stack (`npm run dev:compose`):
    create a job with a source, confirm it displays on the detail
    page; edit an existing seeded job that has no source and confirm
    it still loads and shows "Not set".
13. Close out per the completion rules.

## Verification Plan

Backend, narrow loop while iterating:

```bash
npm run backend:test
```

Backend, after touching the entity/migration:

```bash
npm run backend:test:integration
```

Backend, before finishing:

```bash
npm run backend:verify
```

Frontend, narrow loop while iterating:

```bash
npm --prefix frontend run test -- --run src/features/jobs src/features/jobDetail src/services/jobs
```

Frontend, before finishing:

```bash
npm run frontend:verify
```

Both layers changed (entity, DTOs, and the UI that calls them), so
`npm run verify` runs once at the end.

## Scope Boundaries

- No Discover/import workflow changes - source is set directly on the
  add/edit job form only.
- No analytics or reporting beyond showing the stored value.
- No external provider integrations (no scraping a job posting's
  origin automatically).
- No new UI component (no `SourcePill`), no jobs table or Kanban card
  change - see Decision 5.
- No backfill of existing rows - see Decisions 1 and 2.

## Completion Rules

After `npm run verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/038-add-job-source-tracking.md` and set its status.
- Check the task off in `docs/backlog/phase-5-non-ai-workflows.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Update `docs/context.md` section 5 (`Job` persistence model) to list
  the new `source` field, and section 6 if any API doc line needs it.
- Mark this plan `Completed` and add a verified-state section.

## Acceptance Criteria

- [x] Jobs can store a source.
- [x] Source is visible in the UI.
- [x] No existing job data breaks.

## Verified State

Built as planned, with one addition the plan did not anticipate and
one migration rename.

**Changed from the plan.**

- The migration is `V6__alter_jobs_table_add_source.sql`, matching the
  `<verb>_<table>_table` shape of `V2`-`V5`. The plan first said
  `V6__add_job_source.sql`.
- `useJobStatus.ts` builds its `PUT /api/jobs/{id}` body by hand and
  did not include `source`. `PUT` replaces every editable field, so
  changing a job's status from the detail page would have sent
  `source: null` and cleared the saved source. Nothing in the plan's
  file list touched it and the compiler cannot see it, because
  `source` is optional. The regression test was written first and
  failed against the unfixed code (`expected null to be 'XING'`); one
  added line, `source: job.source`, fixes it. This is the
  "no existing job data breaks" criterion in a place the plan did not
  look.
- Adding `source` to the wire and form types broke 8 existing test
  files that pinned exact request bodies, key sets, or the single
  "Not set" on the detail header. All were updated because the
  behavior intentionally changed, not weakened.

**Verification.**

- `npm run backend:verify` passes: ktlint, detekt, tests, and the 100
  per cent line and branch coverage gate. `npm run
  backend:test:integration` passes against a real PostgreSQL.
- `npm run frontend:verify` passes: ESLint, Prettier, 132 test files
  and 427 tests, 100 percent of lines (1130/1130) and functions
  (446/446), 99.02 percent of branches (612/618, up from 99.01), and a
  production build.
- The images were rebuilt from this branch and loaded into the local
  Kubernetes cluster (`docker:build`, `k8s:load-images`,
  `k8s:restart`). The backend applied `6 - alter jobs table add
  source` on top of a database that already held saved jobs, moving it
  from version 5 to 6, and `GET /api/jobs` then returned those jobs
  with `"source":null` and every other field intact.
- `npm run api:test` against that stack: 30 requests, 84 assertions, 0
  failures. Create sends and echoes `LINKEDIN`; update clears it with
  `null`.

**Manual check.** The author exercised the add, edit and detail flow
by hand in a browser after the automated checks; the form, the detail
header and the "Not set" fallback are also covered by React Testing
Library tests. `npm run compose:smoke` was not run, because no Docker,
Compose or Kubernetes file changed.
