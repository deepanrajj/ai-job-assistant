# Task 044 - Add Profile Resume Library

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Let users manage reusable resume profiles for different target roles.

## Scope

In scope:

- Add Profile page content for base, frontend, backend, and full-stack profiles.
- Store profile summary, experience highlights, education, links, and notes.
- Allow selecting a profile later for AI CV drafts.

Out of scope:

- AI extraction.
- PDF/DOCX export.
- Full resume builder styling.

## Required Changes

- Add resume profile data model support.
- Create profile list and edit UI.
- Add tests for profile CRUD/display behavior.

## Tests

- Profiles can be created and edited.
- Profile list renders saved profiles.
- Empty profile state is accessible.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Profile page has resume profiles.
- [ ] Users can manage multiple profiles.
- [ ] Profiles are ready for later AI workflows.

## Commit

```text
task-044: add profile resume library
```
