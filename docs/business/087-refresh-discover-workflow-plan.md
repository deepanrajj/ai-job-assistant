# Task 087 - Refresh Discover Workflow Plan

Status: Completed

## Purpose

Bring Discover - saved searches, candidate intake, and candidate review
and import - into the visual system set by tasks 084 to 086, without
changing what any of its actions do or the feedback they give.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/087-refresh-discover-workflow.md`
- `docs/business/084-frontend-visual-refresh-plan.md` (D1, D4, D5)
- The owner's Discover reference image (saved searches and "Add
  candidates" side by side, "Import candidates" review table below),
  visual only

## Current State

Read on `feat/task-087-refresh-discover-workflow` at `1ccd76e` (tasks
084 to 086 merged).

- `discoverRoute` picks one of two variants at module load:
  `DiscoverRouteWithSearches` when `SAVED_SEARCHES_FEATURE_ENABLED`
  (dev and tests), otherwise the "Coming soon" fallback. The candidate
  section is added below the saved searches only when
  `IMPORT_CANDIDATES_FEATURE_ENABLED`.
- `DiscoverPage` stacks a plain heading, a New search button, and one
  `Card` per saved search in a two-column grid, each with Edit and a
  solid red Delete. The editor replaces the list while open.
- `ImportCandidatesSection` stacks a heading, an intake `Card`, and a
  "Candidates to review" `Card`. Each candidate is a bordered box with
  a checkbox, label, a "location · source · review status" line, the
  duplicate sentence in coloured text, the source link, the description
  in a `details`, and Edit and Delete.
- Actions and their feedback, all kept:
  - Saved searches: load (loading, error with Try again), empty state,
    New, Edit, Delete, save and delete errors (`mutationError` alert),
    the editor's field errors and skill validation.
  - Intake: save and correct, Cancel while correcting, field errors on
    blur, failed save keeps the values, `mutationError` alert above the
    form.
  - Review: load (loading, error with Try again, error above a stale
    list), empty state, per-row selection, "Select new and possible",
    "Clear selection", the live "n of m selected" count, duplicate
    states (checking, unavailable, new, possible, likely), Edit (off
    for imported), Delete, the import confirmation with the selected
    list and the likely-duplicate warning, import success, per-candidate
    failures, and a failed import request.
- The "Import candidates" subtitle still says "importing comes next",
  written before task 049 shipped the import.

## Decisions

### D1 - The intake as a right sidebar

From `xl` up, the page has two columns: saved searches and the review
fill the wider main column (two thirds), and the intake sits in a
sidebar (one third) spanning both rows. On screens tall enough to show
the whole form (56rem), the sidebar is sticky under the header, so a
candidate can be added while reviewing a long list. Below `xl` the three
cards stack in DOM order: saved searches, intake, review, so the empty
state's "paste a job description above" stays true.

This replaces the first arrangement, which followed the reference image:
saved searches and the intake side by side above a full-width review.
Running it showed the saved searches card at 262px beside a 598px form,
leaving a large empty gap under the saved searches; the owner chose the
sidebar over the alternatives below.

The intake's fields use two columns only when the card itself is at
least `@lg` (32rem) wide, a Tailwind container query, so they stack in
the sidebar and pair up when the card spans the page.

`ImportCandidatesSection` takes the saved searches as a `beside` slot
and places them, because the intake and the review share state (the
candidate being corrected) and must stay in one component. When the
candidate flag is off, the route renders the saved searches alone at
full width.

Rejected:

- **Side by side above the review** (the first version). Leaves the gap
  described above whenever few searches are saved.
- **Equal-height cards.** Moves the gap inside the saved searches card.
- **Everything stacked.** No gap, but a long page on wide screens.
- **A compacted form.** Narrows the gap without removing it, and a
  shorter description box makes pasting harder.
- **`display: contents` on the candidate section** so a route-level grid
  could place its children. Browsers have dropped elements with
  `display: contents` from the accessibility tree, which would lose the
  "Import candidates" region.
- **Lifting the editing state into the route.** It moves behaviour to
  change a layout.

### D2 - Saved searches as one card of rows

One card titled "Saved searches", New search in its header, and the
searches as divided rows: a tinted search icon (lilac, mint, peach in
turn), the name as the row heading, role and location, seniority and
work modes, skill chips, and notes. Edit and Delete become small ghost
buttons with icons; Delete keeps its danger colour as text, not a solid
red block repeated on every row. Loading, error, and empty states sit
inside the same card. The editor still replaces the card while open.

`Card` gains an optional `titleId`, which names its section by its
title, so the card stays the "Saved searches" region. It is opt-in so
every other titled card does not become a landmark.

Rejected:

- **A per-row "more" menu**, as in the image. It adds a menu pattern
  for two actions that fit as buttons.
- **New-match counts.** Nothing runs a search; the task rules them out.

### D3 - The intake keeps one manual form

The intake card is titled "Add a candidate" (or "Correct candidate")
with a one-line subtitle saying a candidate is not a job until
imported. It keeps every field of the manual form.

Rejected:

- **The image's "From URL" and "From text" tabs.** The app never fetches
  a link (`sourceUrl` is metadata only), so a URL tab would promise an
  import that does not exist.

### D4 - The review as one card with a selection toolbar

The review card carries the "Import candidates" heading and an updated
subtitle, then a toolbar with the live selected count, "Select new and
possible", "Clear selection", and "Import selected (n)" on the right.
Import feedback and the confirmation follow the toolbar, so they stay
next to the action that produced them. Candidates are divided rows: the
checkbox, the label as heading, location and source, then a review
status badge and the duplicate sentence in a tinted box (success, warning,
danger, or neutral) so it reads as a flag, not body text. Selected rows
are tinted. Long links break inside the row.

The review status moves from the meta line to a badge, so the meta line
reads "Berlin · Entered manually" and the badge "Imported as a job"; the
affected test changes with it.

Rejected:

- **A semantic table**, as in the image. Each candidate carries a
  description, a link, and a duplicate reason that do not fit columns,
  and the list is already tested as a list of candidates.
- **A select-all header checkbox and "Refresh matches".** New behaviour,
  and there is nothing to refresh.
- **Company logos, a source column, "Date found".** Not stored, or not
  shown before; D1 of plan 084 rules out mock data.

### D5 - Import success uses the shared alert

The success message becomes a success `Alert` with `role="status"`, so
it looks like the other feedback; it stays a polite live region.

### D6 - Subtitle copy catches up with the import

"Importing comes next" becomes "Select the ones to import as jobs", in
English and German, since task 049 shipped the import.

## Proposed Change

- `components/ui/Card.tsx`: optional `titleId`.
- `pages/discover/DiscoverPage.tsx`: one card of saved search rows.
- `features/discover/components/ImportCandidatesSection.tsx`: `beside`
  slot, intake card with subtitle, review card with toolbar, row
  restyle, success alert.
- `routes/modules/discoverRoute.tsx`: pass the saved searches as
  `beside`, or render them alone when candidates are off.
- `features/discover/components/SavedSearchEditor.tsx`: unchanged; it
  fits the narrower column as it is.
- `i18n/locales/en.json`, `de.json`: intake subtitle, review subtitle.

## Tests

- `Card`: `titleId` names the section; without it no region is named.
- `ImportCandidatesSection`: the review status badge, the `beside`
  content rendered next to the intake, and every existing behaviour
  test unchanged except the meta-line text.
- `DiscoverPage`: existing tests (region, row heading, skills, notes,
  editor) keep passing; loading and error sit inside the card.
- `discoverRoute`: both flags on renders both regions; fallback stays.

## Implementation Order

1. `Card` `titleId` and its test.
2. `DiscoverPage` rows. Expect the region test to fail until the card
   carries `titleId`.
3. `ImportCandidatesSection` layout and rows. Expect the meta-line test
   to fail until it is updated for the badge.
4. Route wiring and strings.
5. Visual check in the dev server at desktop and phone widths, with long
   titles and URLs.

## Verification Plan

Affected Vitest files, then `npm run frontend:verify`. Visual check of
the enabled route in the dev server at desktop and phone widths. The
production fallback is covered by `discoverRoute.test.tsx` and keeps
`ComingSoonPage`, already restyled by task 084. E2E is left to CI.

## Scope Boundaries

- No API, mapping, storage, or feature-flag changes.
- No fetching, match counts, new sources, or select-all.

## Completion Rules

Mark this plan and the task file Completed only after verification
passes, and update the phase backlog file.

## Acceptance Criteria

- [x] Discover follows the approved layout and palette.
- [x] Existing review and import behaviour and failure feedback stay
  clear.
- [x] Flagged and fallback variants stay correct.
- [x] Desktop and mobile layouts are accessible.
- [x] Focused tests and frontend verification pass.

## Verified State

- From `xl` up, saved searches and the review fill the main column and
  the intake is a right sidebar, sticky on tall screens; below `xl` they
  stack. With the candidate flag off, the saved searches render alone.
- Saved searches are one named card of rows with tinted icons, skill
  chips, and ghost Edit and Delete; loading, error, and empty states sit
  inside it.
- The review card has a selection toolbar with Import selected on the
  right, feedback and the confirmation under it, and divided candidate
  rows with a review status badge and a tinted duplicate flag.
- Checked in the running dev app at 1536 px and in a 390 px frame: no
  horizontal overflow, a long role and a long link wrap inside their
  row, a likely duplicate shows in red and starts unselected, the
  confirmation opens and cancels, and the editor fits its column.
- `npm run frontend:verify` passed 1001 tests in 185 files, lint,
  format check, coverage, and build. E2E is left to CI.
