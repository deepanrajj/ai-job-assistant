# Task 034 - Add Error States For API Screens Plan

Status: Completed

## Purpose

Task 034's stated scope is "standardize error states" and "ensure
errors are announced or reachable by assistive technology" across the
dashboard, jobs list, job detail, forms, tasks, notes, and timeline
screens. An audit (below), run the same way task 033's was, found every
one of those screens already renders its errors through `ErrorState` or
`Alert`, both of which default to `role="alert"`, and every error
message already comes from a normalized `AppError.message`. There is no
gap at that layer.

Asked how to close a task whose named scope is already satisfied, the
user chose to treat the app's one real related gap as in scope: there
is no top-level fallback for a rendering exception that no API-error
screen state can catch, because it is not an API error at all. React
Router's `errorElement` (already wired on the router's root route,
`RouteErrorElement`) turns out to already act as that fallback - it
catches both loader errors and render exceptions thrown anywhere inside
a matched route, confirmed with a throwaway test before writing this
down (see Verified). It just does not reuse `ErrorState` and has no
`role="alert"`, so unlike every other error screen in the app, a crash
currently renders with no accessible-technology announcement. This plan
closes that one gap rather than building a new boundary component from
scratch.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/034-add-error-states-for-api-screens.md`
- `docs/business/033-add-loading-states-for-api-screens-plan.md` (the
  audit shape this task reuses)

## Current State

### Audited: every named screen already renders errors accessibly

| Screen/control | Error rendering |
| --- | --- |
| Dashboard (`DashboardPage.tsx`) | `ErrorState` |
| Jobs list (`JobsPage.tsx`) | `ErrorState` |
| Job detail load (`JobDetailPage.tsx`) | `ErrorState` (+ not-found) |
| Job detail delete failure (`JobDetailPage.tsx`) | `ErrorState` |
| Edit job load (`EditJobPage.tsx`) | `ErrorState` (+ not-found) |
| New/Edit job save failure (`JobForm` callers) | `ErrorState` |
| Tasks tab load error (`JobDetailTasksPanel.tsx`) | `ErrorState` |
| Tasks tab mutation error | `Alert` |
| Notes tab load error (`JobDetailNotesPanel.tsx`) | `ErrorState` |
| Notes tab mutation error | `Alert` |
| Timeline tab load error (`JobDetailTimelinePanel.tsx`, task 032) | `ErrorState` |
| AI analyze/ask errors (`JobDetailAiPanel.tsx`, `AskJob.tsx`, `AnalysisInputCard.tsx`) | `Alert` |

Grepped every `.message` render site (`AppError.message`, specifically)
across `frontend/src/pages` and `frontend/src/features`: every result
feeds into an `ErrorState`'s `description` prop or an `Alert`'s
children, with no orphaned/unwrapped error text anywhere. Grepped
`<Alert` directly for the same reason: five call sites, all default to
`role="alert"` (`Alert`'s own default), none override it. `ErrorState`
hardcodes `role="alert"` with no way to override it at all. Retry or
navigation actions are already present everywhere a retry is possible
(`jobs.loadErrorRetry` buttons, "Back to jobs"); load-and-display panels
with no separate retry button (tasks/notes mutation `Alert`s) already
document why one is not offered - the row/form itself is the retry.

### Verified before writing this plan

**`RouteErrorElement` already behaves as a root error boundary**,
confirmed with a throwaway probe (deleted after): a memory router with
one route whose `element` throws during render (not from a `loader`)
still renders `RouteErrorElement` via `errorElement`. This is
documented React Router data-router behavior - `errorElement` catches
both loader/action errors and render exceptions from the matched route
subtree - but was verified directly rather than assumed, since nothing
in this codebase previously exercised the render-exception path.
`RouteErrorElement.test.tsx` only covered `loader`-thrown errors before
this task; a third case for a render-time throw is added by this plan
to keep that verified fact under test rather than only proven once
by hand.

**`RouteErrorElement`'s current markup has no `role="alert"` and does
not reuse `ErrorState`.** Read `routes/RouteErrorElement.tsx`: a bare
`<Card>` with a hand-rolled `<h1>`, a status paragraph, a description
paragraph, and two buttons. Every other error screen in the app is
`ErrorState`-shaped and gets `role="alert"` from it automatically; this
one does not, so it is the one error surface in the app a screen reader
does not get told about when it appears.

**Dropping the `<h1>` does not remove an established pattern - it
matches one.** `DashboardPage.tsx`, `JobsPage.tsx`, `JobDetailPage.tsx`,
and `EditJobPage.tsx` all render `ErrorState` as their error branch with
no page heading at all; `ErrorState`'s own `title` is a bold `<p>`, not
a heading, and `DashboardPage.test.tsx` already asserts its error state
by `getByRole('alert')` + `toHaveTextContent`, not by heading. Moving
`RouteErrorElement` to `ErrorState` brings it in line with every other
top-level error screen rather than losing something those screens have.

## Decisions

### Decision 1: reuse `RouteErrorElement`/`errorElement`, do not add a new boundary component

A new hand-written class-based `ErrorBoundary` would duplicate what
`errorElement` already does for this app (React Router's data router
requires the class-component boundary machinery internally; this app
never needs to write it directly because `createBrowserRouter` already
wires one for every route under `AppShell`, `routes/router.tsx`).
Rejected: adding a second, narrower `<ErrorBoundary>` wrapped around
part of the tree for defense in depth. Rejected because nothing in this
codebase currently needs a fallback scoped narrower than "the whole
routed app" - no route lazily loads two independent widgets where one
crashing should leave the other alive - and adding one speculatively
contradicts `AGENTS.md`'s "smallest change" rule and `frontend/AGENTS.md`
section 5's "no data-fetching/architecture library beyond what is
asked for."

### Decision 2: keep the status code display, drop the `<h1>`

The HTTP status (`error.status` for a thrown `Response`, such as a
`loader` failure) stays as its own small text above the `ErrorState`,
unchanged from today - it is supplementary detail, not the primary
announcement, and neither `ErrorState` nor any other error screen in
the app has a slot for it. The `<h1>` is dropped per Verified: no other
top-level `ErrorState` screen has one, and `role="alert"` already
announces the whole block on mount regardless of heading structure.

### Decision 3: the two actions become `ErrorState`'s `action` prop

"Go to dashboard" and "Try again" (a full reload) move from bare
`<Button>`s next to a hand-rolled description into `ErrorState`'s
`action` slot, matching how every other `ErrorState` with actions in
the app (`jobs.loadErrorRetry` buttons, `JobDetailPage`'s not-found
"Back to jobs") already renders them.

## Proposed Change

### Changed files

| File | Change |
| --- | --- |
| `routes/RouteErrorElement.tsx` | render `ErrorState` (status text kept above it, title/description/action moved into it) instead of a hand-rolled `Card` |
| `routes/RouteErrorElement.test.tsx` | update the two existing cases to query by `role="alert"`/text instead of a heading role; add a third case proving a render-time throw (not just a `loader` throw) is also caught |

No new files, no backend change, no new library.

## Tests

### `RouteErrorElement.test.tsx`

| Case | Asserts |
| --- | --- |
| renders translated route errors with the response status (existing, requery) | `getByRole('alert')` has the title/description text; `'503'` still renders; both action buttons present |
| handles non-response errors and retry actions (existing, requery) | same, no status text; "Try again" reloads (still exercised, unchanged behavior); "Go to dashboard" navigates |
| catches a render exception, not just a loader error (new) | a route whose `element` throws during render still renders the same `role="alert"` fallback |

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add the new "catches a render exception" case to
   `RouteErrorElement.test.tsx` first, against the *current*
   implementation - it should already pass, proving `errorElement`'s
   render-exception behavior before anything else changes.
3. Rewrite `RouteErrorElement.tsx` to use `ErrorState`. Run the file's
   tests: the two existing heading-role queries now fail to find a
   heading, proving the markup actually changed.
4. Update the two existing tests' queries to `role="alert"`/text.
5. `npm run frontend:verify`.
6. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/routes/RouteErrorElement.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No new `ErrorBoundary` component - `errorElement` already is one
  (Decision 1).
- No change to any tasks/notes/timeline/AI `Alert` usage - all already
  correct (Current State audit).
- No toast system, no backend error contract change, per the task
  file's own out-of-scope list.
- No new library.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/034-add-error-states-for-api-screens.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated, for the same reason tasks 030-033
  recorded: it does not enumerate per-screen error-handling detail.

## Acceptance Criteria

- [x] API screens have consistent error states.
- [x] Error states are accessible.
- [x] Tests cover error behavior.

## Verified State

Built as planned, following the decisions above exactly.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 122
test files and 384 tests (one added), 100 percent of lines (1036/1036)
and functions (409/409), production build fine. Branch coverage is
98.97 percent (577/583), unchanged from task 033 - the same four
pre-existing files below it remain the only ones below full branch
coverage, confirmed from the per-file report.

### What was built

An audit (Current State) found every named API-backed screen already
routed its errors through `ErrorState` or `Alert`, both defaulting to
`role="alert"`, with messages already normalized through `AppError`.
The one gap, chosen by the user from two options after the audit
turned up nothing else, was `RouteErrorElement` - the router's
`errorElement` fallback, which was verified (throwaway test, kept as a
permanent regression case) to already catch render exceptions the same
way it catches `loader` failures, making it the app's de facto root
error boundary already. It just did not reuse `ErrorState` and had no
`role="alert"`, unlike every other error screen. It now does, with its
status-code display and two actions kept, moved into `ErrorState`'s
`action` slot.

### Failures observed deliberately

The new "catches a render exception, not just a loader error" test was
run first against the *unchanged* implementation and passed,
confirming `errorElement`'s render-exception behavior was real before
any production code changed. The two existing tests' `getByRole('heading', ...)`
queries were run against the rewritten `RouteErrorElement` before being
updated and failed to find a heading, confirming `ErrorState` (a bold
`<p>`, not a heading) actually replaced the old hand-rolled `<h1>`
markup.

### Changed from the plan

A post-PR code review (`/code-review PR 51`) found that Decision 2
(dropping the `<h1>`) was wrong for this specific case, even though it
correctly matched `DashboardPage`/`JobsPage`/`JobDetailPage`: those
pages' `ErrorState`s render inside `AppShell`, which itself has no
heading either, but `RouteErrorElement` is rendered by `errorElement`
*in place of* `AppShell` - it is the entire page, not content inside a
shell. Removing the old `<h1>` left a full page with zero heading
elements, a real regression for assistive-technology heading
navigation, a primary AT navigation pattern.

Fixed by adding a visually-hidden (`sr-only`) `<h1>` carrying the same
title text, so heading navigation finds the page while the visible
design and the `ErrorState`-driven `role="alert"` announcement are both
unchanged. A regression test (`getByRole('heading', { level: 1, ... })`)
was added to the first case rather than all three, since all three
render the same markup and the first already covers every other
assertion for this fallback.
