# Task 090 - Refresh Profile Page Plan

Status: Completed

## Purpose

Bring the Profile page into the visual system set by tasks 084 to 089,
following the prototype's composition: an account summary, the resume
library beside the skills, and the job preferences below, with real
stored data everywhere except the account summary (D1).

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md` (§3, including "Button variants")
- `docs/context.md`
- `tasks/roadmap/090-refresh-profile-page.md`
- `docs/business/084-frontend-visual-refresh-plan.md`
- `docs/business/087-refresh-discover-workflow-plan.md` (saved-search
  rows, the closest existing pattern)
- `docs/mockups/smart-job-tracker.html` (`profile()`), visual only

## Current State

Read on `feat/task-090-refresh-profile-page` at `251db53` (tasks 084
to 089 merged).

- `profileRoute` shows the resume library (`PROFILES_FEATURE_ENABLED`,
  task 044) and, below it, `ProfilePreferencesSection`
  (`PREFERENCES_FEATURE_ENABLED`, task 045), each with its own request;
  "coming soon" while both are off (production builds). The dev server
  serves both from mocks.
- `ProfilePage` is a heading, a solid "New profile", and a two-column
  grid of cards, each with solid primary Edit and solid danger Delete,
  the target role, the summary, and entry counts. The editor replaces
  the list while open.
- `ProfilePreferencesSection` is one card with one always-open form:
  skills, target roles, locations, work modes, seniority, keywords, one
  Save for the whole record, and a status line ("Saved 4 Oct 2026",
  "Saving…", "Preferences saved").
- `TagListEditor` (also used by Discover's editor) renders grey chips.
- `ResumeProfileEditor`'s Remove buttons are solid `danger`.
- No account data exists: no name, headline, location, or avatar.

## Decisions

### D1 - An account summary card from mock data (owner decision)

Owner decision, 2026-10-18: build the prototype's layout, including
its account summary card, "and use mock data for account data". The
task file ruled account data out; it was updated to record the
decision. The card shows an initials avatar, a name, a headline and
location, and a few tags, all from one `TEMPORARY` mock module
(`features/profile/accountSummary.mock.ts`) so a real account source
can replace it in one place. The card is marked "Sample data" in words,
so a viewer never takes it for stored data.

The prototype's "Edit profile" button is left out: there is nothing to
edit and no account flow, and a button that does nothing is worse than
none. Rejected: deriving the summary from preferences (the roles are
target roles, not a current title), and a disabled button.

### D2 - The resume library as one card of rows

As Discover's saved searches (task 087 D2): one "Resume library" card,
"New profile" (`primary`, the card's one create action) in its header,
and divided rows. A row has a document icon tile (lavender, mint, peach
in turn by position), the name as its heading, the target role and
"Updated {date}", the summary clamped to two lines, and the entry
counts. Edit becomes `ghost` and Delete `dangerGhost`, with icons, as
the task's button-variant step requires. Loading, error, and empty
states sit inside the card. The editor replaces the card while open.

The prototype's "View" is not added: a profile has no read view, and
Edit already opens it. Rejected: a two-column grid of cards (the old
layout), which does not fit beside the skills.

### D3 - Skills and job preferences as two cards with a view and an edit mode

The prototype shows skills as chips in their own card and the
preferences as a read-only summary with "Edit preferences". The record
stays one record with one save (`PUT /api/profile/preferences`), so:

- **Skills card:** the skills as chips; "Edit skills" switches the card
  to the skills `TagListEditor` with Save and Cancel.
- **Job preferences card:** target roles, locations, work mode,
  seniority, and keywords as labelled values; "Edit preferences"
  switches it to those fields with Save and Cancel.
- Both editors keep the existing form logic (normalising, the typed
  but not added text, focusing a blocked field, keeping stored values
  it would not accept today) and save the **whole** record: the fields
  the card edits, over the stored values of the rest.
- **One editor at a time.** A save returns a new record, and the open
  form takes it over; a second open editor would lose its unsaved
  edits. While one card edits, the other card's edit button is
  disabled.
- Save closes the editor; Cancel discards it. Both move focus to the
  card's edit button, so focus never falls to the page. A failed save
  keeps the editor open with the entered values and the error.
- The status line ("Saved {date}", "Saving…", "Preferences saved")
  moves to the Job preferences card's view and stays mounted, so a save
  from either card is announced.
- Loading and a load error show once, in one "Skills and job
  preferences" card, not twice.
- Review fixes: a save error belongs to the editor it happened in, so
  `useProfilePreferences` gains `clearSaveError`, called when an editor
  opens or closes, as the library's `clearMutationError` is; "Preferences
  saved" is reset when a save starts, so a later failed save falls back
  to the stored date; focus goes back to the edit button through a ref
  (`Button` now accepts `ref`) and waits until the button is enabled,
  and only when focus fell to the page, never away from where the user
  moved it (second review). The status reads "Skills and preferences
  saved", as it covers both cards; a stored value named like a built-in
  object property (`constructor`) shows as it is (`Object.hasOwn`).

Rejected: keeping one always-open form (the prototype's summary would
then repeat the form), and two separate saves of partial records (the
endpoint replaces the whole record).

### D4 - Layout and flags

From `xl` the library and the Skills card sit side by side, the Job
preferences card below across both columns; below `xl` everything
stacks. A grid with the cards in that order does it without the route
knowing their contents. When only one flag is on, its cards take the
full width. While the profile editor is open, the grid becomes one
column (`xl:has-[[data-editor]]:grid-cols-1`), since the editor's
two-column fields need the width; widening only the library left Skills
alone beside an empty column (review). Job preferences uses
`col-span-full`, which fits either grid, so the section needs no layout
prop. The library hides its editor while the list loads or failed to
load, so an open profile never turns into a new one (review). The account card shows whenever the
route does.

Rejected: side by side from `lg`, which was built first. Measured in
the dev app at 1024 px, each column was 340 px beside the sidebar, too
narrow for a row's name beside Edit and Delete; at 1280 px they are
476 px. The same reason tasks 088 and 089 start their splits at `xl`.

### D5 - Chips and editors

`TagListEditor`'s chips take the primary tint (`bg-primary-50
text-primary-800`), as the view chips do, so a skill looks the same in
both modes; Discover's editor gets the same chips, which is intended.
The library card has no padding, for its rows, so its loading and
error boxes, which draw their own border, get the card's `p-5`. Discover
had the same flaw since task 087; it is filed and fixed as bug 007.
`ResumeProfileEditor`'s Remove becomes `dangerGhost` (it is not a final
confirmation). Long values wrap (`break-words`) instead of widening the
card. A new `DocumentIcon` marks the library rows and its empty state.

### D6 - Focused checks

Profile page, preferences section, route, tag editor, and Discover
editor tests, lint, format, and `tsc -b`; the full suite and E2E are
left to CI.

## Proposed Change

- `features/profile/accountSummary.mock.ts` and
  `components/ProfileSummaryCard.tsx` (D1).
- `pages/profile/ProfilePage.tsx`: library card of rows (D2).
- `features/profile/components/ProfilePreferencesSection.tsx`: Skills
  and Job preferences cards, view and edit modes (D3).
- `routes/modules/profileRoute.tsx`: summary card and grid (D4).
- `TagListEditor.tsx`, `ResumeProfileEditor.tsx`: chips, Remove (D5).
- Strings in both languages for the new card titles, buttons, and the
  sample-data label.

## Tests

- Library: rows with name, role, updated date, summary, counts; Edit
  and Delete variants; editor, empty, loading, error, write error, as
  now.
- Skills and Job preferences: view mode values and empty values; each
  editor opens, saves the whole record with its own changes, cancels,
  returns focus; one editor at a time; the existing validation, typed
  text, and stored-value tests through the editors; save error keeps
  the editor; loading and load error once.
- Route: summary card, grid order, and each flag combination.

## Implementation Order

1. Preferences section and its tests: the largest behaviour change;
   expect most existing tests to fail until they open an editor first.
2. Library rows; expect the Edit/Delete queries to keep working, as
   their names do not change.
3. Summary card, route grid, chips, Remove variant.
4. Strings, focused checks, and a visual check at 1536, 1280, 1024, and
   390 px in both languages, with each flag combination.

## Verification Plan

Focused Vitest files for the changed and affected code, ESLint,
Prettier, and `tsc -b`, then the visual check above. Full suite and E2E
in CI.

## Scope Boundaries

- No API, storage, feature-flag, or authentication changes; the account
  card reads mock data only.
- No resume file upload, AI extraction, or salary fields.

## Completion Rules

Mark this plan and the task Completed after the focused checks pass,
and update the phase backlog.

## Acceptance Criteria

- [x] Profile follows the approved layout with actual stored fields,
      and mock data only in the marked account card.
- [x] Resume, skills, and preferences flows retain their behavior.
- [x] Independent flags and failure states remain correct.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests pass.

## Verified State

- Account summary card from `MOCK_ACCOUNT_SUMMARY`, marked "Sample
  data"; resume library as a card of rows with `ghost` Edit and
  `dangerGhost` Delete; Skills and Job preferences cards with view and
  edit modes, one editor at a time, focus back on the edit button, and
  the status line under Job preferences.
- Focused checks: Profile page, route, profile feature, Discover page
  and feature, and icon tests (41 files, 188 tests), ESLint, Prettier,
  and `tsc -b` passed. The full suite and E2E are left to CI. After the review fixes: 83 files, 298 tests
  across the Profile, Discover, route, and shared component tests.
- Checked in the dev server: 1536 and 1280 px side by side (604 and
  476 px columns), 1024, 768, and 390 px stacked, no horizontal
  overflow at any width; the profile editor spans the row (1217 px at
  1536); German at 390 px, where the Skills button now says
  "Fähigkeiten bearbeiten" to match the card title.
