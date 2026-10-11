# Frontend Visual Refresh Plan

Status: In progress (task 084 complete; tasks 085-092 planned)

## Purpose

Apply the selected light dashboard design consistently to the existing
React application. The [standalone HTML prototype](../mockups/smart-job-tracker.html)
shows serif headings, white cards, and an indigo, lilac, mint, and peach
palette across the six main routes. It is a visual reference, not a source
of application behavior or data. A later user-provided sidebar image
supersedes its navigation layout while the indigo palette remains in use.

## Current State

- Before task 084, `frontend/src/index.css` defined a blue Tailwind theme
  and `AppShell` rendered a fixed desktop sidebar and mobile nav row.
- Dashboard, Jobs, Discover, Applications, Calendar, and Profile already
  have route components and tests. Jobs also has detail and create/edit
  routes.
- Reminders, documents, calendar, saved searches, import candidates,
  resume profiles, and preferences have frontend feature flags while
  their backend work is pending.

## Decisions

### D1 - Preserve product behavior

The prototype's sample counts, companies, dates, status labels, search
icon, avatar, and inactive buttons are illustrative. Use existing
services, data models, translations, controls, and route paths. Do not
copy the HTML prototype into the production bundle or replace API data
with mock data. Do not add search, notifications, accounts, file uploads,
or unsupported status stages just because they appear in an image.

### D2 - Establish the palette in existing tokens

Adapt the existing Tailwind theme and shared UI primitives. The visual
starting values from the HTML prototype are ink `#111b4b`, primary
indigo `#272b78`, canvas `#fcfbfa`, lilac `#eeeaff`, mint `#e5f5e9`,
peach `#fff0e6`, and border `#e9e9ef`. Adjust shades as needed to keep
text, controls, hover states, focus rings, and feedback accessible.
The adopted values refine these: primary `#363c8c` with a matching 50-900
scale; a neutral ink `#1a1d2e` so indigo marks only brand and interactive
elements; warm neutral surfaces and borders (`#f6f5f3`, `#e8e6e1`) to
match the warm canvas; a teal-leaning mint `#e3f3f1` so decoration does
not read as success; and a softer `success-500` `#0f9f6e`.
Preserve semantic success, warning, and danger distinctions. Use Inter,
self-hosted through `@fontsource-variable/inter` (SIL OFL 1.1), for body
and display text, with system sans-serif fallbacks. This font package was
added at the owner's request; no other styling system is required.

### D3 - Change the shell once

Task 084 owns the collapsible desktop sidebar, icon-only mode, tablet and
mobile header menu, active link, global Add Job header action, shared
spacing, and shared primitives. Keep all six final navigation
destinations, a compact language switch, the skip link, and accessible
route focus. The header uses the existing logo and a real Profile link;
it does not show fictitious account details. Below the `sm` breakpoint,
Add Job and the language switch move from the header into the menu
drawer (language beside the close button, a full-width Add Job below), so
the phone header holds only the menu, logo, and Profile link. A global search field waits for a real shared search capability. Do not duplicate an Add Job action
in the same viewport when a page already provides one.

### D4 - Map each page to available data

Dashboard uses recorded status history and current jobs. Its reminder
area may adopt the mock's weekly presentation only from existing dated
reminders while the reminders feature is enabled. Keep the documented
unavailable response-rate explanation. Jobs uses the existing status
enum, list/board switch, filtering, and sorting. Discover keeps manual
candidate review and duplicate feedback. Applications displays document
metadata, not file content. Calendar keeps its accessible full-month
grouped list alongside the visual grid, event types, and month controls.
Profile uses stored resume entries, skills, and
preferences; omit salary or account fields that do not exist.

### D5 - Feature flags and failure states remain valid

Visual work may use the current dev mocks to preview flagged pages. It
must not flip production flags or claim the pending backend endpoints
are complete. Every page task covers its loading, empty, error, and
disabled/coming-soon presentation where those states exist.

### D6 - Validate page by page

Each implementation task is one focused change after task 084. Use
existing React/Tailwind components, add or update behavior tests in the
affected layer, run the affected Vitest file, lint, format check, and
build, and visually check desktop and narrow viewports. Leave the broad
coverage and E2E suites to CI under the owner's local verification
preference.
Tasks 091 and 092 bring job detail and create/edit screens into the same
visual system; task 092 performs a final cross-route visual review. Task 071 can
capture README screenshots after the refresh is complete.

## Task Mapping And Order

| Task | Scope | Depends on |
| --- | --- | --- |
| [084](../../tasks/roadmap/084-refresh-frontend-theme-and-shell.md) | Palette, shared UI, responsive sidebar and header | None |
| [085](../../tasks/roadmap/085-refresh-dashboard-layout.md) | Dashboard | 084 |
| [086](../../tasks/roadmap/086-refresh-jobs-list-and-board.md) | Jobs list and board | 084 |
| [087](../../tasks/roadmap/087-refresh-discover-workflow.md) | Saved searches and candidate review | 084 |
| [088](../../tasks/roadmap/088-refresh-applications-page.md) | Application document overview | 084 |
| [089](../../tasks/roadmap/089-refresh-calendar-page.md) | Calendar | 084 |
| [090](../../tasks/roadmap/090-refresh-profile-page.md) | Resume profiles, skills, preferences | 084 |
| [091](../../tasks/roadmap/091-refresh-job-detail-page.md) | Job detail and tabs | 084 |
| [092](../../tasks/roadmap/092-refresh-job-forms-and-review-design.md) | Job create/edit forms and final visual review | 084-091 |

Tasks 085-091 can follow any order after 084, one numbered task at a
time. They do not depend on the unfinished backend tasks 040-049; their
feature flags and API boundaries remain in place.

## Completion Criteria

- All six main routes, job detail, and job forms use a coherent visual
  system without losing existing actions or translations.
- Real data and current API/error behavior remain intact.
- Flagged features still behave correctly in development and production
  modes.
- Keyboard navigation, focus, readable contrast, and responsive layout
  are verified per task and across the final route set.
- The HTML prototype stays a reference artifact; it is not served as a
  production route.
