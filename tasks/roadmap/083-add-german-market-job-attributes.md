# Task 083 - Add German Market Job Attributes

Status: Not started

Related plan: [Product improvements - R-13 German market employment attributes](../../docs/business/product-improvements-and-recommendations-plan.md#recommendation-register).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`,
and `../../docs/context.md` before starting.

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- Employment terms that matter most when evaluating a German job offer
  are not generic across markets: fixed-term (`Befristet`) vs.
  permanent contracts, probation length (`Probezeit`), notice period
  (`Kündigungsfrist`), collective bargaining coverage (`Tarifvertrag`),
  weekly hours, and vacation days are standard parts of a German
  contract but have no field in the current job model.
- Visa/relocation-dependent applicants also need to know sponsorship
  availability (including EU Blue Card eligibility) and the required
  German language level before investing time in an application.
- This is independent of R-07 (currency, pay period, work mode,
  employment type), which already owns compensation-shaped fields.
  This task owns employment-term fields R-07 does not cover.

Related docs:

- `docs/backlog/phase-5-non-ai-workflows.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  (R-13 and its "German market employment attributes" row)

## Goal

After this task:

- A job can record: contract type (permanent or fixed-term, with an
  end date when fixed-term), probation length, notice period,
  collective bargaining coverage, weekly hours, and vacation days.
- A job can record visa/Blue Card sponsorship availability (yes/no/
  unknown) and the required German level (A1-C2, or none/unspecified).
- All fields are optional; existing jobs have no assumed values.
- These fields are visible and editable in the job create/edit forms
  and job detail view.

## Scope

In scope:

- New optional fields on the job model for the attributes listed above.
- Form fields on create/edit with sensible defaults of "unknown"/unset,
  never a guessed value.
- Display these fields on the job detail view.
- Backend validation limited to enumerated values (e.g. contract type,
  German level) where a fixed set of options exists.

Out of scope:

- Offer comparison across jobs (R-08's scope, once it exists).
- Compensation fields: currency, pay period, salary basis (R-07's
  scope).
- Any inference of these fields from a pasted job description or AI
  extraction. Values are user-entered only.
- Retroactive backfill for existing jobs beyond leaving the new fields
  unset.

## Pre-Execution

Before changing files:

1. Confirm the current `Job` entity/schema and where these fields fit
   without colliding with R-07's planned compensation fields.
2. Decide the enumerated value sets (contract type, German level) and
   record them before implementing, matching the style of existing
   enums such as job status.
3. Confirm the create/edit form structure these fields will extend.

Stop and ask if product or architecture intent is unclear.

## Required Changes

- Add a Flyway migration for the new nullable job columns.
- Add the fields to the `Job` entity, service commands, and DTOs.
- Add corresponding create/edit form fields and job detail display.
- Keep all new fields optional end to end; no field defaults to a
  guessed non-null value.

## Data And Contracts

- New nullable columns on `jobs`: contract type, fixed-term end date,
  probation length, notice period, collective bargaining coverage,
  weekly hours, vacation days, visa/Blue Card sponsorship status,
  required German level.
- Extend `POST /api/jobs` and `PUT /api/jobs/{id}` request/response
  DTOs with the new optional fields; no new endpoints.

## Tests

- A job can be created/updated with each new field set.
- A job can be created/updated with the fields omitted, and reads back
  as unset, not a default value.
- Enumerated fields reject an unrecognized value.
- Existing jobs without these fields continue to read and update
  correctly.

## Validation

Run the focused check for the touched layer (entity/repository change
needs `npm run backend:test:integration`), then:

```bash
npm run backend:verify
npm run frontend:verify
npm run verify
```

## Acceptance Criteria

- [ ] New job fields exist and are optional.
- [ ] Create/edit forms expose the new fields.
- [ ] Job detail view displays the new fields.
- [ ] No field is inferred or defaulted to a guessed value.
- [ ] Required verification passes.

## Commit

```text
task-083: add german market job attributes
```
