# Task 090 - Refresh Profile Page

Status: Completed

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype shows a profile summary, resume library, skills, and job
preferences. The app has resume-profile and preference flows behind
separate feature flags while their backend endpoints are pending.

## Goal

Give the existing Profile sections the approved card hierarchy and
palette without inventing preference data; account data is sample data
only, marked as such.

## Scope

In scope:

- Restyle the real resume-profile list/editor, skills inventory,
  preferences form, and page-level fallback presentation.
- Keep sections independently visible when only one feature flag is on.
- Preserve existing add/edit/delete controls, validation, errors, and
  empty states.

Owner decision (2026-10-18): follow the prototype's layout, including
its account summary card, filled from clearly marked mock data in one
`TEMPORARY` module until accounts exist. See the plan's D1.

Out of scope:

- Authentication, stored account or avatar data, actual resume file
  uploads, salary preferences not in the model, AI extraction, or
  backend changes.
- Turning on `PROFILES_FEATURE_ENABLED` or
  `PREFERENCES_FEATURE_ENABLED` in production.

## Pre-Execution

1. Inspect `ProfilePage`, its route module, resume editor, preference
   section, tag editor, and their tests.
2. Map the prototype's fields to existing data; omit unsupported
   fields rather than adding placeholder controls.

## Required Changes

1. Apply task 084's shared components and tokens to the page and
   editors, keeping visible labels and keyboard controls.
2. Preserve independent loading/error/empty behavior for resume
   profiles and preferences.
3. Check long tags, form errors, and small screens.
4. Apply the button variants in `../../frontend/AGENTS.md` §3 "Button variants". Found
   in task 088's audit: the profile list's Edit is `primary` (should be
   `ghost`), and its Delete and the editor's Remove are solid `danger`
   (should be `dangerGhost` unless they are the final confirmation).

## Data And Contracts

No API, user identity, storage, or feature-flag changes.

## Tests

- Resume and preference sections render correctly under each flag
  combination.
- Existing editor actions, validation, and save errors remain visible.
- Long content wraps or scrolls without hiding actions.

## Validation

Run affected Profile Vitest files, then `npm run frontend:verify`.
Visually inspect desktop, mobile, and flag combinations. Report
focused local checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [x] Profile follows the approved layout with actual stored fields.
- [x] Resume, skills, and preferences flows retain their behavior.
- [x] Independent flags and failure states remain correct.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests and frontend verification pass.

## Commit

```text
task-090: refresh profile page
```
