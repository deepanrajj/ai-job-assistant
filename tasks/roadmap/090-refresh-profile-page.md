# Task 090 - Refresh Profile Page

Status: Not started

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
palette without inventing account or preference data.

## Scope

In scope:

- Restyle the real resume-profile list/editor, skills inventory,
  preferences form, and page-level fallback presentation.
- Keep sections independently visible when only one feature flag is on.
- Preserve existing add/edit/delete controls, validation, errors, and
  empty states.

Out of scope:

- Authentication/profile avatar data, actual resume file uploads, salary
  preferences not in the model, AI extraction, or backend changes.
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

- [ ] Profile follows the approved layout with actual stored fields.
- [ ] Resume, skills, and preferences flows retain their behavior.
- [ ] Independent flags and failure states remain correct.
- [ ] Desktop and mobile layouts are accessible.
- [ ] Focused tests and frontend verification pass.

## Commit

```text
task-090: refresh profile page
```
