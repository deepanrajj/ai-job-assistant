# Task 033 - Add Loading States For API Screens Plan

Status: Completed

## Purpose

Task 033's stated scope is "standardize loading states" and "ensure
accessible status semantics" across the dashboard, jobs list, job
detail, forms, tasks, notes, and timeline screens. An audit (below)
found every one of those screens already has a page/panel-level
`LoadingState` + `ErrorState` pair from earlier tasks (024-032). What is
missing is narrower and more specific: several write buttons across the
app have no `aria-busy` at all, unlike the write buttons the app already
got right (delete job, analyze job, ask job). This plan closes that gap
rather than re-adding loading states that already exist.

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md`
- `tasks/roadmap/033-add-loading-states-for-api-screens.md`
- `docs/business/030-connect-tasks-tab-to-backend-plan.md`,
  `031-connect-notes-tab-to-backend-plan.md`,
  `032-connect-timeline-tab-to-backend-plan.md` (built the panels this
  task edits)

## Current State

### Audited: every named screen already has a page/panel-level loading state

| Screen | Loading | Error | Empty |
| --- | --- | --- | --- |
| Dashboard (`DashboardPage.tsx`) | `LoadingState` | `ErrorState` | n/a (renders its own empty sections) |
| Jobs list (`JobsPage.tsx`) | `LoadingState` | `ErrorState` | `DataTable`'s `emptyState` |
| Job detail (`JobDetailPage.tsx`) | `LoadingState` | `ErrorState` (+ not-found) | n/a |
| Edit job (`EditJobPage.tsx`) | `LoadingState` | `ErrorState` (+ not-found) | n/a |
| New job (`NewJobPage.tsx`) | n/a - nothing to fetch before the form renders | `ErrorState` on a failed create | n/a |
| Tasks tab (`JobDetailTasksPanel.tsx`, task 030) | `LoadingState` | `ErrorState` | n/a (form is always visible) |
| Notes tab (`JobDetailNotesPanel.tsx`, task 031) | `LoadingState` | `ErrorState` | n/a (form is always visible) |
| Timeline tab (`JobDetailTimelinePanel.tsx`, task 032) | `LoadingState` | `ErrorState` | `EmptyState` |

Grepped `LoadingState` and `isLoading` across `frontend/src/pages` and
`frontend/src/features`: no API-backed screen renders content while its
initial request is still pending without one of the states above.

### Audited: three different "busy button" patterns already coexist

| Pattern | Where | Shape |
| --- | --- | --- |
| A - persistent row action, kept focusable | `JobDetailHeader`'s delete-job button | `aria-busy`, **not** `disabled` (a `pointer-events-none` class blocks the click instead), label text unchanged |
| B - single-purpose submit, disabled while busy | `JobDetailAiPanel`'s analyze button, `AskJob`'s ask button, `AnalysisInputCard`'s analyze button | `aria-busy` **and** `disabled`, label swaps to a busy verb ("Analyzing...", "Asking...") |
| C - no busy semantics at all | `JobForm`'s submit button (`NewJobPage`/`EditJobForm`), every button in `JobDetailTasksPanel`/`JobDetailNotesPanel` | `disabled` only; no `aria-busy`, no label change |

Pattern A is deliberately different from B - `JobDetailPage.test.tsx`'s
own comment on the delete button explains why (disabling would blur a
keyboard user's focus for the length of the request). That reasoning is
specific to a single persistent button a user stays on the page with
after a failed request, and does not generalize to a full-page form
submit or a list of interchangeable row actions.

Pattern C is the gap this task closes. A screen reader user gets no
indication that "Create job", "Save note", or the task checkbox's
request is in flight - the controls simply stop responding to focus
between the click and the response landing.

### Verified before writing this plan

**`JobForm`'s submit button has no `aria-busy`.** Read
`features/jobs/components/JobForm.tsx`: `<Button disabled={isSubmitting}
type="submit">{submitLabel}</Button>` - no `aria-busy`, and `submitLabel`
is a static string passed once by the caller, so the label cannot change
either.

**Every write control in the tasks and notes panels has no `aria-busy`.**
Read `JobDetailTasksPanel.tsx`: the toggle checkbox, the delete button,
and the "Add task" submit button all use `disabled` alone. Read
`JobDetailNotesPanel.tsx`: same for the save button, the delete button,
and the "Add note" submit button.

**No existing precedent for `aria-busy` on a non-button control.**
Grepped `aria-busy` across `frontend/src`: every existing use is on a
`<Button>`. The task checkbox and the note's edit `<textarea>` are left
out of this task's changes for that reason (Decision 3).

## Decisions

### Decision 1: `JobForm`'s submit button follows pattern B, not pattern A

`JobForm`'s submit is a full-page primary action, the same shape as the
AI-analyze and ask-job submits (a single button that starts one request
and the user waits on), not a persistent row action the user keeps
interacting with after a failure (pattern A's case). It gets
`aria-busy={isSubmitting}` and a label that swaps to a new
`busySubmitLabel` prop while `isSubmitting` is true, mirroring
`ai.analyzing`/`ai.asking`. `disabled={isSubmitting}` already exists and
is kept - unlike the delete-job button, a full-page form has no
in-place retry the user needs to keep focus for; disabling and moving
focus loss is an accepted cost here already, unchanged by this task.

Rejected: keeping only `aria-busy` and dropping the label change, to
minimize new translation keys. Rejected because every other pattern-B
button in the app changes its label, and a submit button that says
"Create job" while `aria-busy="true"` and disabled is a smaller, weaker
signal than the rest of the app already gives for the identical
situation.

### Decision 2: tasks/notes panel write buttons follow pattern A, not pattern B

The task and note row buttons (toggle, save, delete) and each panel's
"Add" submit are followed by other visible feedback already
(`mutationError` renders an `Alert`, and the row/list stays on screen
either way), so there is no full-page "wait state" to name. They get
`aria-busy` bound to the same `isDisabled`/`isMutating` flag that already
drives their `disabled` prop, with no label change - matching pattern
A's lighter shape rather than duplicating pattern B's four new busy
verbs ("Toggling...", "Deleting...", "Saving...", "Adding...") for
row-scoped actions where the existing `Alert` and disabled-control
feedback already carry the load.

Rejected: also disabling via `pointer-events-none` instead of `disabled`
to match pattern A exactly. Rejected because `disabled` is the existing,
tested behavior for these controls (`toBeDisabled()` assertions already
exist for all of them) and changing it is a bigger, riskier edit than
this task's actual goal - adding the missing `aria-busy` attribute
without changing what already works.

### Decision 3: no `aria-busy` on the task checkbox or the note textarea

Both already go `disabled` while a write is in flight, which is the
correct signal for an input a user would otherwise try to keep editing.
`aria-busy` is an ARIA state for "this element's content/state is
updating," which fits a button that triggers and represents an action,
not a form control whose own disabled state already says "not
editable right now." No use of `aria-busy` on a non-button anywhere in
the codebase supports adding one here, so this task does not start a
new, uninspected precedent.

### Decision 4: new busy-label keys use the same tense as `ai.analyzing`/`ai.asking`

`jobForm.actions.creating` = "Creating..." / `jobForm.actions.saving` =
"Saving..." (German: "Erstelle..." / "Speichere...", matching
"Analysiere..."/"Frage..."'s present-tense-continuous style). Both
locales get both keys; `JobForm` requires `busySubmitLabel` as a prop
so a caller cannot forget to supply one, the same way `submitLabel` is
already required.

## Proposed Change

### Changed files

| File | Change |
| --- | --- |
| `features/jobs/components/JobForm.tsx` | add required `busySubmitLabel` prop; submit button gets `aria-busy={isSubmitting}` and swaps its label to `busySubmitLabel` while `isSubmitting` |
| `features/jobs/components/JobForm.test.tsx` | cover the busy label and `aria-busy` |
| `pages/jobs/NewJobPage.tsx` | pass `busySubmitLabel={t('jobForm.actions.creating')}` |
| `pages/jobs/NewJobPage.test.tsx` | extend the existing in-flight test to assert `aria-busy` and the swapped label |
| `pages/jobs/EditJobForm.tsx` | pass `busySubmitLabel={t('jobForm.actions.saving')}` |
| `pages/jobs/EditJobPage.test.tsx` | extend the existing in-flight test to assert `aria-busy` and the swapped label |
| `features/jobDetail/components/JobDetailTasksPanel.tsx` | `aria-busy={isDisabled}` on the delete button; `aria-busy={isMutating}` on the "Add task" submit |
| `features/jobDetail/components/JobDetailTasksPanel.test.tsx` | extend "disables the form and task controls while a write is in flight" to assert `aria-busy` |
| `features/jobDetail/components/JobDetailNotesPanel.tsx` | `aria-busy={isDisabled}` on the save and delete buttons; `aria-busy={isMutating}` on the "Add note" submit |
| `features/jobDetail/components/JobDetailNotesPanel.test.tsx` | extend "disables controls while a write is in flight" to assert `aria-busy` |
| `i18n/locales/en.json`, `de.json` | add `jobForm.actions.creating`, `jobForm.actions.saving` |

No new files. No backend change.

## Tests

### `JobForm.test.tsx`

Extends the existing "disables the submit button while submitting" case
(renamed to describe the fuller behavior) to also assert
`aria-busy="true"` and that the button's accessible name is now the
`busySubmitLabel` text, not `submitLabel`.

### `NewJobPage.test.tsx`, `EditJobPage.test.tsx`

Both already have an "in flight" case that captures the submit button
before clicking and awaits `toBeDisabled()`. Each adds an assertion on
the same captured element for `aria-busy="true"` and its updated
accessible name ("Creating..."/"Saving...").

### `JobDetailTasksPanel.test.tsx`

"disables the form and task controls while a write is in flight" adds
`aria-busy` assertions for the delete button and the "Add task" submit
alongside its existing `toBeDisabled()` checks.

### `JobDetailNotesPanel.test.tsx`

"disables controls while a write is in flight" adds `aria-busy`
assertions for the save button, delete button, and "Add note" submit
alongside its existing `toBeDisabled()` checks.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add the two translation keys, both locales. Nothing reads them yet.
3. Change `JobForm` to take `busySubmitLabel` and render the busy state.
   Every caller now fails to compile until step 4 - `busySubmitLabel` is
   required, matching `submitLabel`.
4. Update `NewJobPage` and `EditJobForm` to pass `busySubmitLabel`.
   Compiles again; existing tests that query the button by its
   not-busy name still pass.
5. Extend `JobForm.test.tsx`, `NewJobPage.test.tsx`,
   `EditJobPage.test.tsx` for the busy state.
6. Add `aria-busy` to `JobDetailTasksPanel`'s delete and add-task
   buttons; extend its in-flight test.
7. Add `aria-busy` to `JobDetailNotesPanel`'s save, delete, and
   add-note buttons; extend its in-flight test.
8. `npm run frontend:verify`.
9. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/features/jobs/components/JobForm.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/pages/jobs/NewJobPage.test.tsx src/pages/jobs/EditJobPage.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/features/jobDetail/components/JobDetailTasksPanel.test.tsx src/features/jobDetail/components/JobDetailNotesPanel.test.tsx
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No new loading/error/empty states on dashboard, jobs list, job
  detail, or the tab panels - all already exist (Current State audit).
- No `aria-busy` on the task checkbox or note textarea (Decision 3).
- No behavior change to the existing delete-job button (pattern A is
  already correct there and is not this task's gap).
- No new library.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/033-add-loading-states-for-api-screens.md` and set its
  status.
- Check the task off in
  `docs/backlog/phase-4-frontend-backend-integration.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated; it does not enumerate per-control
  accessibility semantics at this level of detail.

## Acceptance Criteria

- [x] API screens have consistent loading states.
- [x] Loading states are accessible.
- [x] Tests cover loading behavior.

## Verified State

Built as planned, following the decisions above exactly.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 122 test
files and 379 tests, 100 percent of lines (1024/1024) and functions
(405/405), production build fine. Branch coverage is 98.97 percent
(577/583, up from 575/581 - two new branches added by the busy/not-busy
label ternary, both covered); the same four pre-existing files below it
(`jobFormSchema.ts`, `JobDetailPage.tsx`, `EditJobForm.tsx`,
`NewJobPage.tsx`) remain the only ones below full branch coverage,
confirmed from the per-file report - no new gap.

### What was built

An audit (Current State) found every named screen already had a
page/panel-level `LoadingState`/`ErrorState` from tasks 024-032, so no
new loading state was added at that level. The real gap was per-button
`aria-busy`: `JobForm`'s submit button (used by `NewJobPage` and
`EditJobForm`) gained a required `busySubmitLabel` prop, `aria-busy`,
and a label that swaps to it while submitting, matching the
`ai.analyzing`/`ai.asking` pattern. `JobDetailTasksPanel`'s delete and
"Add task" buttons and `JobDetailNotesPanel`'s save, delete, and "Add
note" buttons gained `aria-busy` bound to the same flags that already
drove their `disabled` state, with no label change, matching the
delete-job button's lighter pattern. Two new translation keys
(`jobForm.actions.creating`/`saving`) were added to both locales.

### Failures observed deliberately

Step 3 (changing `JobForm`'s `busySubmitLabel` to a required prop)
broke the build until `NewJobPage` and `EditJobForm` were updated in
step 4, confirming both callers were found and no third caller exists.

### Changed from the plan

None. The design followed the plan's decisions as written, including
the scope the user chose explicitly (job form plus tasks/notes
mutation buttons, not job form alone) when asked before this plan was
written.
