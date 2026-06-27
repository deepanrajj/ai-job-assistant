# Task 041 - Add Application Documents

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

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
