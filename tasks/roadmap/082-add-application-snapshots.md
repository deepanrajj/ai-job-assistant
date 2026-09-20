# Task 082 - Add Application Snapshots

Status: Not started

Related plan: [Product improvements - R-03 application snapshots](../../docs/business/product-improvements-and-recommendations-plan.md#recommendation-register).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`,
and `../../docs/context.md` before starting.

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- Job listings and submitted materials both change or disappear after
  submission. Without a snapshot, a user preparing for an interview
  weeks later cannot see the job description or CV text the employer
  actually received.
- Task 041 tracks application document *metadata* (version label,
  submitted date, portfolio link) but explicitly leaves out exact
  submitted content. This task is the follow-up that captures the
  content itself, as task 041's own scope boundary anticipated.

Related docs:

- `docs/backlog/phase-5-non-ai-workflows.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  (R-03 and its "Application snapshots" row)

## Goal

After this task:

- Marking an application document as submitted captures an immutable
  snapshot of the job description text and the submitted material's
  text at that moment, with a timestamp.
- The snapshot is viewable later even if the job description or
  document metadata changes afterward.
- Later edits to the job or document never overwrite an existing
  snapshot.

## Scope

In scope:

- A snapshot data model holding: job description text, submitted
  material text (per document), and a captured timestamp, linked to
  the job and to the application document it snapshots.
- Capture the snapshot at the point a document's submitted date is set
  (the existing task 041 "submitted" action), not on every edit.
- Accept pasted/typed text for the submitted material, matching task
  041's metadata-first approach. No file upload.
- Display the snapshot on the job detail / Applications view once
  submitted.
- Read-only after capture: no snapshot edit or delete API.

Out of scope:

- File upload storage or PDF/DOCX handling.
- AI-generated snapshot content.
- Automatic snapshot capture from a job status change; capture is tied
  to the explicit "submitted" action on a document, not to status.
- Retroactive snapshots for documents already marked submitted before
  this task ships.
- Multiple snapshots per document (a resubmission is out of scope here).

## Pre-Execution

Before changing files:

1. Confirm task 041's document metadata model and its "submitted date"
   field/action; this task hooks into that action rather than
   inventing a new trigger.
2. Confirm the job entity's current `description` field is the source
   for the job-description half of the snapshot.
3. Decide the snapshot's persistence shape (own table vs. columns on
   the document) and record the decision before implementing.

Stop and ask if product or architecture intent is unclear.

## Required Changes

- Add snapshot persistence linked to a job and its application
  document.
- Capture job description text and submitted material text once, at
  the "mark as submitted" action.
- Add a read path returning the snapshot for a submitted document.
- Add snapshot display in the relevant frontend view.
- Do not add any update/delete endpoint for a captured snapshot.

## Data And Contracts

- New persisted fields/table: job description snapshot text, submitted
  material snapshot text, captured timestamp, and the document/job
  foreign keys.
- New read endpoint(s) under the existing job/document API shape.
- No change to existing job or document write endpoints beyond
  triggering the capture when "submitted" is set.

## Tests

- Marking a document submitted captures a snapshot with the current
  job description and submitted text.
- The snapshot is unchanged after the job description is edited later.
- The snapshot is unchanged after the document metadata is edited
  later.
- No snapshot is created until the document is marked submitted.
- Missing job/document error cases match existing conventions.

## Validation

Run the focused check for the touched layer, then:

```bash
npm run backend:verify
npm run frontend:verify
npm run verify
```

## Acceptance Criteria

- [ ] Submitting a document captures an immutable snapshot.
- [ ] Snapshot content survives later job/document edits.
- [ ] Snapshot is viewable from the relevant frontend view.
- [ ] No snapshot mutation API exists.
- [ ] Required verification passes.

## Commit

```text
task-082: add application snapshots
```
