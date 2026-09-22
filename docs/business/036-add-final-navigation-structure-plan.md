# Task 036 - Add Final Navigation Structure Plan

Status: Completed

## Purpose

Move the frontend's navigation from its Phase-1 shape (Dashboard, Jobs,
AI Assistant) to the final product shape `docs/context.md` names:
Dashboard, Jobs, Discover, Applications, Calendar, Profile. Four of
those sections have no workflow yet, so this task adds accessible
placeholder pages for them rather than building anything they will
eventually do. `AI Assistant` stops being a nav item, per
`docs/context.md` section 12 ("`AI Assistant` is not a final top-level
navigation item"), but its route and page stay reachable directly, per
the task file's own "preserving any current development route if still
needed."

## Authoritative References

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/context.md` (section 1's "Final product navigation" list and
  section 12's AI-Assistant-is-not-a-nav-item rule are both locked
  decisions this task implements, not proposes)
- `tasks/roadmap/036-add-final-navigation-structure.md`

## Current State

### Audited: the nav config, the router, and what reads them

| Piece | File | Current content |
| --- | --- | --- |
| Nav items | `components/appShell/appShell.constants.ts` | Dashboard, Jobs, AI Assistant |
| Nav item id union | `components/appShell/appShell.types.ts` | `'dashboard' \| 'jobs' \| 'ai-assistant'` |
| Nav icons | `components/appShell/appShell.icons.tsx` | `AppLogoIcon`, `DashboardIcon`, `JobsIcon`, `AiAssistantIcon` |
| Route paths | `routes/paths.ts` | `DASHBOARD`, `JOBS`, `JOB_DETAIL`, `JOB_EDIT`, `JOB_NEW`, `AI_ASSISTANT` |
| Route shell metadata | `routes/routes.constants.ts` | one `IAppRouteHandle` (title/subtitle keys) per path key, `satisfies`-checked against every `APP_PATHS` key plus `NOT_FOUND` |
| Router tree | `routes/router.tsx` | one lazy child route per path, each wired to a route module under `routes/modules/` |
| Nav rendering | `components/appShell/layout/AppShellNavigation.tsx` | maps `navItems` to `NavLink`s, shared by the desktop sidebar and the mobile header nav - one config drives both |

**`AppShellNavigation` is the only reader of `navItems`.** Grepped
`navItems` across `frontend/src`: `appShell.constants.ts` (the
definition) and `AppShellNavigation.tsx` (the only import). Removing
`AI Assistant` from that one array removes it from both the sidebar and
the mobile nav in one change, confirming there is no second nav surface
to update separately.

**`AiAssistantIcon` has no consumer besides the nav item being
removed.** Grepped `AiAssistantIcon` outside test files: only
`appShell.constants.ts`. Once the nav entry is removed, the icon
becomes dead and is deleted along with it, per `AGENTS.md`'s "if you are
certain something is unused, delete it completely" - its own test case
in `appShell.icons.test.tsx` is dropped in the same change.

**Nothing else threads `onStatusChange`-style page actions through the
routes this task touches**, so this is purely nav/route/page-shell work
with no interaction with any of tasks 020-035's data-loading hooks.

### Verified before writing this plan

**`routes.constants.ts`'s `satisfies Record<TAppRouteHandleKey, IAppRouteHandle>`
already forces every new `APP_PATHS` key to get a route handle.**
Read `routes.types.ts`: `TAppRouteHandleKey = keyof typeof APP_PATHS |
'NOT_FOUND'`. Adding `DISCOVER`/`APPLICATIONS`/`CALENDAR`/`PROFILE` to
`APP_PATHS` and not adding matching entries to `appRouteHandles` fails
the build at the `satisfies` check, not silently - confirmed by reading
the type, not assumed.

**No test enforces `en.json`/`de.json` key parity.** Grepped
`frontend/src/i18n` for a locale-parity test: none exists (confirmed by
directory listing). Every new key still needs adding to both files by
hand, with nothing catching a missed one.

## Decisions

### Decision 1: one shared `ComingSoonPage`, not four near-identical page components

Discover, Applications, Calendar, and Profile all need the same shape:
an accessible page with no workflow yet. A single
`pages/comingSoon/ComingSoonPage.tsx` (a `Card` wrapping an
`EmptyState`, the same shape `NotFoundPage` already uses) takes
`title`/`description` strings, and each of the four route modules
supplies its own. Rejected: four separate page components. Rejected
because they would be identical except for two translation keys each -
"three similar lines is better than a premature abstraction" cuts the
other way once it is four near-duplicate files instead of three lines.

### Decision 2: the placeholder body copy is one shared pair of keys, not four

The four pages' *page titles* already differ - each gets its own
`route.<name>.title`/`.subtitle` in `appRouteHandles`, rendered by
`AppShellHeader`'s `<h1>`, exactly as every existing route already
works. The `EmptyState` body inside `ComingSoonPage` doesn't need to
repeat that distinction with four more translation keys saying the same
"not built yet" sentence four different ways; one shared
`route.comingSoon.title`/`.description` pair covers all four. Building
four workflows worth of distinct placeholder copy is exactly the
"building every new page workflow" the task file puts out of scope.

### Decision 3: `AI_ASSISTANT` stays in `APP_PATHS`, `routes.constants.ts`, and `router.tsx` unchanged

Only `appShell.constants.ts`'s `navItems` array loses the AI Assistant
entry. The route, its handle, its module, and its page are untouched -
the task file's own scope keeps the current development route reachable
by direct navigation, and `AnalyzeJobPage` is still the surface the AI
provider boundary docs and existing tests describe.

### Decision 4: final nav order matches `docs/context.md` exactly

Dashboard, Jobs, Discover, Applications, Calendar, Profile - not
alphabetical, not implementation order. This is the order the locked
product vision names them in, and it's also the order a user would work
through a job search (find it, apply, track it, prepare for it, get
hired).

## Proposed Change

### New files

| File | Contents |
| --- | --- |
| `pages/comingSoon/ComingSoonPage.tsx` | shared placeholder page (Decision 1) |
| `pages/comingSoon/ComingSoonPage.test.tsx` | renders title/description |
| `routes/modules/discoverRoute.tsx`, `.test.tsx` | `ComingSoonPage` with Discover's copy |
| `routes/modules/applicationsRoute.tsx`, `.test.tsx` | `ComingSoonPage` with Applications' copy |
| `routes/modules/calendarRoute.tsx`, `.test.tsx` | `ComingSoonPage` with Calendar's copy |
| `routes/modules/profileRoute.tsx`, `.test.tsx` | `ComingSoonPage` with Profile's copy |

### Changed files

| File | Change |
| --- | --- |
| `routes/paths.ts` | add `DISCOVER`, `APPLICATIONS`, `CALENDAR`, `PROFILE` |
| `routes/routes.constants.ts` | add matching `appRouteHandles` entries |
| `routes/router.tsx` | add four lazy child routes |
| `routes/router.test.ts` | extend the expected child-path list |
| `components/appShell/appShell.types.ts` | widen `TAppRouteId` |
| `components/appShell/appShell.constants.ts` | replace the AI Assistant entry with Discover/Applications/Calendar/Profile, in final order |
| `components/appShell/appShell.icons.tsx` | add `DiscoverIcon`, `ApplicationsIcon`, `CalendarIcon`, `ProfileIcon`; remove `AiAssistantIcon` |
| `components/appShell/appShell.icons.test.tsx` | swap the removed/added icons |
| `components/appShell/layout/AppShellNavigation.test.tsx` | replace the "AI Assistant" link assertion with a final-nav-item one |
| `i18n/locales/en.json`, `de.json` | add `nav.discover`/`.applications`/`.calendar`/`.profile` (drop `nav.aiAssistant`, now unused by the nav - kept as `route.aiAssistant.*` for the surviving route's own page title); add `route.discover`/`.applications`/`.calendar`/`.profile` (title/subtitle) and `route.comingSoon` (title/description) |

`nav.aiAssistant` is checked for other readers before removal (see
Verified/Implementation Order) - if anything besides the nav item reads
it, it stays.

## Tests

### `ComingSoonPage.test.tsx`

Renders with a title/description pair, asserts both appear.

### Each new route module test

Renders the route component, asserts the page's `EmptyState` title and
description text appear - the same shape `analyzeJobRoute.test.tsx`
uses for its own route module.

### `router.test.ts`

Extends the expected `childRoutes` path list to include the four new
paths in their router-tree order, and keeps asserting every lazy route
resolves.

### `appShell.icons.test.tsx`

Drops the `AiAssistantIcon` case, adds one for each of the four new
icons, matching the existing per-icon attribute assertions.

### `AppShellNavigation.test.tsx`

Replaces the "AI Assistant" link assertion (path `/ai-assistant`) with
one for a final nav item, e.g. Discover at `/discover`, keeping the
existing active-link and href assertions for Dashboard/Jobs unchanged.

## Implementation Order

Each step names the failure to expect.

1. Write this plan and link it from `docs/business/README.md`.
2. Add the four new `APP_PATHS` entries. Nothing consumes them yet.
3. Add the matching `appRouteHandles` entries. Skipping one here would
   fail the `satisfies` check at compile time - the verification this
   plan's Current State section already ran by reading the type.
4. Add `route.<name>.title`/`.subtitle` and `route.comingSoon.*`
   translation keys, both locales.
5. Add `ComingSoonPage` and its test.
6. Add the four route modules and their tests.
7. Wire the four routes into `router.tsx`; extend `router.test.ts`.
   Run it - the path list assertion fails until it is updated, proving
   the new routes actually registered.
8. Add the four new icons; remove `AiAssistantIcon` and its test case.
9. Grep `nav.aiAssistant` for any reader besides `appShell.constants.ts`
   before removing the key from both locale files - if none, remove it;
   otherwise leave it.
10. Update `appShell.types.ts`'s `TAppRouteId` and
    `appShell.constants.ts`'s `navItems`, in final order. Run
    `AppShellNavigation.test.tsx` before touching it - "AI Assistant"
    stops resolving to a rendered link, proving the swap took effect.
11. Update `AppShellNavigation.test.tsx`.
12. `npm run frontend:verify`.
13. Close out per the completion rules.

## Verification Plan

Narrow loop:

```bash
npm --prefix frontend run test -- --run src/routes/router.test.ts src/pages/comingSoon/ComingSoonPage.test.tsx
```

```bash
npm --prefix frontend run test -- --run src/components/appShell
```

Before finishing:

```bash
npm run frontend:verify
```

`npm run verify` is not required. No backend change, no contract
change; the task file's own validation line is `npm run
frontend:verify`.

## Scope Boundaries

- No workflow behavior for Discover, Applications, Calendar, or
  Profile - placeholder pages only, per the task file.
- No removal of the AI Assistant route, page, or backend endpoints -
  only its nav entry.
- No change to any already-implemented page (Dashboard, Jobs, job
  detail, forms).
- No new library.

## Completion Rules

After `npm run frontend:verify` passes:

- Tick the acceptance criteria in
  `tasks/roadmap/036-add-final-navigation-structure.md` and set its
  status.
- Check the task off in `docs/backlog/phase-5-non-ai-workflows.md`.
- Update the recommended next task in `docs/backlog/README.md`.
- Mark this plan `Completed` and add a verified-state section.
- `docs/context.md` is not updated - it already documents the final nav
  shape as a locked decision; this task implements it rather than
  changing what is documented.

## Acceptance Criteria

- [x] Final navigation shape is visible.
- [x] `AI Assistant` is not a final top-level nav item.
- [x] Route tests cover the new navigation.

## Verified State

Built as planned, following the decisions above exactly.

`npm run frontend:verify` passes: ESLint clean, Prettier clean, 128
test files and 405 tests (17 added), 100 percent of lines (1097/1097)
and functions (432/432), production build fine (each new route lazy-
chunks separately, matching the existing per-route code-splitting).
Branch coverage is 98.99 percent (592/598), unchanged from task 035's
baseline - no new gap.

Manually verified in a browser against the dev server: the sidebar and
mobile nav show Dashboard, Jobs, Discover, Applications, Calendar,
Profile in that order with no AI Assistant entry; each of the four new
sections renders its own page title/subtitle plus the shared "Coming
soon" placeholder; `/ai-assistant` still loads the existing analyzer
page directly; all confirmed in German (the browser's detected
locale).

### What was built

Four new routes (`/discover`, `/applications`, `/calendar`,
`/profile`), each a lazy route module rendering a shared
`ComingSoonPage` (a `Card` wrapping an `EmptyState`, the same shape
`NotFoundPage` already used) with its own route-handle title/subtitle
but one shared pair of placeholder-body translation keys. `AI
Assistant` was removed from `appShell.constants.ts`'s `navItems` (and
its now-dead `AiAssistantIcon` deleted with it) while its route,
handle, module, and page stayed untouched in `router.tsx`/`paths.ts`,
reachable by direct navigation only.

### Failures observed deliberately

`router.test.ts`'s path-list assertion was run before the new routes
were wired in and failed to include them, and `AppShellNavigation.test.tsx`'s
"AI Assistant" link assertion was left temporarily failing after the
icon/nav-item removal until the test itself was updated - both
confirmed the changes actually took effect rather than passing
vacuously.

### Changed from the plan

None. The design followed the plan's decisions as written.
