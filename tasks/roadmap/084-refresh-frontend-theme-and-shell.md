# Task 084 - Refresh Frontend Theme And Shell

Status: Completed

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The [HTML prototype](../../docs/mockups/smart-job-tracker.html) establishes
the light indigo palette. A later reference supplied by the user establishes
a collapsible sidebar and shared Add Job header action. This task provides
the shared foundation for the page-specific tasks 085-091.

## Goal

The React app has the approved palette, shared visual tokens, and a
responsive shell with collapsible desktop sidebar navigation.

## Scope

In scope:

- Adapt the existing Tailwind theme, typography hierarchy, surfaces,
  borders, focus states, and shared UI primitives as needed.
- Use a collapsible desktop sidebar with six route links and an icon-only
  state. On tablet and mobile, open the same routes from a header menu.
  Preserve active state, skip link, and keyboard access.
- Use the existing app logo with its title in the header where space
  permits, a compact language switch, and a link to the real Profile
  route. Do not imply a signed-in identity.
- Add a global Add Job action to the header that uses the existing route
  and avoids duplicate actions at the same viewport size.
- Use Inter, self-hosted through `@fontsource-variable/inter` (SIL OFL
  1.1), as the app font. Added to scope at the owner's request.

Out of scope:

- Page-specific content/layout changes owned by tasks 085-091.
- A global search field, notification control, account avatar, or mock
  data without a corresponding real capability.
- Other new fonts, component libraries, API changes, or feature-flag changes.

## Pre-Execution

1. Inspect `frontend/src/index.css`, `components/appShell/`, shared UI
   components, their tests, and the existing mobile breakpoints.
2. Record which current route controls must remain reachable after the
   shell changes, especially language selection and skip navigation.
3. Map prototype colors to existing semantic tokens before editing.

## Required Changes

1. Update theme tokens and the minimum shared primitives needed for
   consistent buttons, cards, badges, inputs, and focus states.
2. Adapt `AppShell`, its layout components, and navigation to the
   approved header and responsive sidebar without changing route paths.
3. Keep route headings and the main-content landmark correctly
   associated. Check desktop, tablet, and narrow mobile layouts.
4. Update English and German labels only when new visible wording is
   actually introduced.

## Data And Contracts

No API, database, storage, or feature-flag changes. The Add Job action
routes to the existing create page.

## Tests

- Active navigation follows nested job routes and all six main routes.
- Keyboard users can reach the skip link, language switch, navigation,
  sidebar controls, and Add Job action; focus remains visible.
- The compact-screen drawer closes on route selection or Escape and
  returns focus to its menu button.
- Narrow screens expose every destination without clipped controls or
  inaccessible overflow.

## Validation

Run affected AppShell/shared UI Vitest files, lint, format check, and
production build. Per the repository owner's local verification preference,
leave the full coverage suite and E2E suite to CI. Visually inspect the
shell at desktop and mobile widths. Report focused local checks and CI E2E
status accurately in the PR description.

## Acceptance Criteria

- [x] The app uses the approved palette and shared surface hierarchy.
- [x] Responsive, collapsible sidebar navigation works on desktop and
  moves into a header menu on tablet and mobile.
- [x] All existing navigation, language, and accessibility controls work.
- [x] No prototype-only controls or mock data enter production code.
- [x] Focused tests, lint, format check, and production build pass.

Local verification: 34 focused shell, language, and Jobs tests passed for
the latest header change; lint, format check, and build passed. Desktop,
tablet, and 320 px mobile layouts were inspected in the running app. Full
coverage and E2E suites were not run locally and remain for CI.

Follow-up at the owner's request: the palette was refined (primary
`#363c8c`, neutral ink, warm surfaces), Inter was added through
`@fontsource-variable/inter` (SIL OFL 1.1) despite the original
no-new-fonts note, selected nav and language states use a light primary
tint with dark text, and enabled buttons regain the pointer cursor. After
these changes `npm run frontend:verify` passed 935 tests, lint, format
check, coverage, and build.

On phones (below `sm`), Add Job and the language switch now sit in the
menu drawer instead of the header, at the owner's request: the language
switch beside the close button and a full-width Add Job below it.

Second PR review fixes: the drawer no longer reopens after Back/Forward
and closes through the shared `useBreakpoint('lg')` hook; the first-run
Jobs empty state offers Add Job on phones; the skip link is inert while
the drawer is open; the focus trap skips hidden controls in every browser;
the desktop sidebar scrolls in short windows; collapsed links use the
shared `Tooltip` (new `right` placement); and the collapse toggle no
longer duplicates its state with `aria-expanded`.

PR review fixes: the page heading renders inside `<main>`; route changes
scroll to the top and focus `<main>` without scrolling; the drawer closes
on any route change and at the desktop breakpoint, makes the rest of the
page inert, and locks body scroll; language buttons are named with their
visible code (for example "DE German"); collapsed sidebar links show a
label on hover and keyboard focus; duplicate landmark names and the unused
`LanguageIcon` and `app.stage` key are removed. `npm run frontend:verify`
passed 940 tests after these changes.

## Commit

```text
task-084: refresh frontend theme and shell
```
