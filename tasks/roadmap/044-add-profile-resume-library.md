# Task 044 - Add Profile Resume Library

Status: In progress - frontend complete behind a feature flag, backend pending

Progress is tracked in the
[plan](../../docs/business/044-add-profile-resume-library-plan.md#progress).

- [ ] **Remove the temporary profile mock and feature flag once the
  backend lands.** Delete `frontend/src/services/profiles/profiles.mock.ts`
  and its test, the `USE_MOCK_PROFILES` branches and import in
  `profiles.service.ts`, and `PROFILES_FEATURE_ENABLED` with the places
  that read it. Until then built images keep Profile on "coming soon",
  and the mock runs only in the Vite dev server.

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

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
- Give reusable profile entries stable identifiers that survive text
  edits and reordering, so later fit/draft workflows can reference their
  source. AI tasks capture the entry content used for each run; this task
  does not implement AI output storage or profile version history. See
  the [profile evidence plan](../../docs/business/product-improvements-and-recommendations-plan.md#ai-claims-need-profile-evidence).
- Create profile list and edit UI.
- Add tests for profile CRUD/display behavior.

## Tests

- Profiles can be created and edited.
- Profile list renders saved profiles.
- Empty profile state is accessible.
- Entry identifiers remain stable after editing and reordering.

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
