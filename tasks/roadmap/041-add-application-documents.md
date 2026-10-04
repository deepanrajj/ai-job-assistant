# Task 041 - Add Application Documents

Status: In progress - frontend complete behind a feature flag, backend pending

Progress is tracked in the
[plan](../../docs/business/041-add-application-documents-plan.md#progress).

- [ ] **Remove the temporary document mock and feature flag once the
  backend lands.** Delete `frontend/src/services/documents/documents.mock.ts`
  and its test, the `USE_MOCK_DOCUMENTS` branches and import in
  `documents.service.ts`, and `DOCUMENTS_FEATURE_ENABLED` with the places
  that read it. Until then built images hide the documents UI, and the
  mock runs only in the Vite dev server.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Track application documents and submitted material for each job.

## Scope

In scope:

- Track CV version, cover letter version, portfolio link, submitted date, and document notes.
- Show documents in Applications and job detail workflows.
- Keep this as metadata first.

Out of scope:

- File upload storage.
- PDF/DOCX generation.
- AI-generated documents.

## Required Changes

- Add document metadata model support.
- Add create/edit UI.
- Connect document metadata to jobs and Applications navigation.

## Tests

- Document metadata can be saved.
- Submitted date and portfolio link render.
- Empty document state is accessible.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Application documents are trackable.
- [ ] Applications area has useful content.
- [ ] No file storage is introduced.

## Commit

```text
task-041: add application documents
```
