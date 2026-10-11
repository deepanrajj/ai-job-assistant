# Task 089 - Refresh Calendar Page

Status: Not started

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype gives the month grid most of the space and places dated
next steps beside it. The current Calendar page already composes
calendar items from its existing frontend feature and is behind a flag
until task 042's backend endpoint is ready.

## Goal

Make the existing Calendar page resemble the approved month layout
without losing date navigation or event details.

## Scope

In scope:

- Restyle the existing month grid, event indicators, date controls, and
  accessible full-month list. Arrange the list beside the grid at wide
  widths where it fits, without reducing it to only upcoming items.
- Preserve current date-only and timed event handling, localization,
  links, and available navigation.
- Style loading, empty, error/retry, and feature-disabled states.

Out of scope:

- A week-view control unless a working week view already exists.
- Calendar-file export, external synchronization, notification delivery,
  new endpoints, or changing the calendar flag.

## Pre-Execution

1. Inspect `CalendarPage`, its route, calendar utilities/components,
   event types, and tests.
2. Confirm current month navigation and the relationship between the
   visual grid and screen-reader-accessible grouped list.

## Required Changes

1. Apply shared cards, typography, status colors, and focus styling
   from task 084 to the calendar composition.
2. Keep the full-month list available on every screen, retain the
   non-duplicated accessibility tree, and keep event labels readable
   without relying on color alone.
3. Avoid horizontal clipping at narrow widths.
4. Preserve real event data and all current loading/error/fallback
   behavior.

## Data And Contracts

No API, date model, storage, or feature-flag changes.

## Tests

- Month navigation and event links retain behavior; every loaded item
  remains available in the grouped list.
- Date-only events remain on the correct local calendar day.
- Empty, loading, error, and flag-disabled views remain clear.

## Validation

Run affected Calendar Vitest files, then `npm run frontend:verify`.
Visually inspect month boundaries and narrow screens. Report focused
local checks and actual CI E2E status in the PR.

## Acceptance Criteria

- [ ] Calendar follows the approved month-grid composition.
- [ ] Dates and event types are accurate and readable.
- [ ] Existing navigation and failure states still work.
- [ ] Flagged and narrow-screen variants remain accessible.
- [ ] Focused tests and frontend verification pass.

## Commit

```text
task-089: refresh calendar page
```
