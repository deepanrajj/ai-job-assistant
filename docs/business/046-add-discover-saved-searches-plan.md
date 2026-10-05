# Task 046 - Add Discover Saved Searches Plan

Status: In progress

## Purpose

Give the Discover page its first content: reusable job search criteria
- a role, a location, seniority, skills, work modes, and notes - saved
under a name, ready for later import and discovery flows to run. No AI,
no job provider, no scheduled runs.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Service, normalization, mock, hook, editor, page, route, flag | Done; `npm run frontend:verify` passed (792 tests) |
| Backend | `/api/saved-searches` CRUD storing `criteriaJson` (D1) | Not started (user-written) |
| API collection | `Saved searches` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **Dev server with the mock** (port 5173) at 375 px and 1280 px: the
  seeded search lists with role, location, seniority, work modes,
  skills, and notes; the editor opens; no horizontal scroll; no request
  reached `/api/saved-searches`.
- **Built image** (compose, port 30080): Discover shows "Coming soon"
  and makes no request.
- `CheckboxGroup` moved out of 045's section into its own component;
  045's tests pass unchanged.

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md` (`SavedSearch` is `id, userId, criteriaJson,
  createdAt, updatedAt`; this plan keeps it)
- `tasks/roadmap/046-add-discover-saved-searches.md`
- `docs/business/045-add-skills-inventory-and-preferences-plan.md`
  (shared types, normalization, and controls)

## Current State

Read on `feat/task-045-add-skills-inventory-and-preferences` at
`c8fd013` (stacked on PR #63).

- **Discover** (`/discover`) renders `ComingSoonPage`.
- **045** added work mode and seniority types, list normalization, a
  chip-list editor, and a checkbox group.
- The locked `SavedSearch` model has no name column.

## Decisions

### D1 - Keep the locked model: everything, name included, in `criteriaJson`

The API stores one `criteriaJson` document per search:

```text
name        text, required: how the user finds the search again
role        text            e.g. "Backend Engineer"
location    text            e.g. "Berlin"
seniority   (JUNIOR | MID | SENIOR | LEAD)[]
skills      string[]        normalized as in 045
workModes   (REMOTE | HYBRID | ONSITE)[]
notes       text
```

`GET /api/saved-searches`, `POST`, `PUT /{id}`, `DELETE /{id}`; body
`{ criteria }`, response `{ id, criteria, createdAt, updatedAt }`.
`userId` joins with task 052.

Rejected: a separate `name` column. It changes a locked model for a
label that belongs with the criteria it describes.

### D2 - Reuse 045's vocabulary and controls

Seniority and work mode use 045's types and labels, so a search and the
user's preferences can be compared later without mapping. Skills use the
same normalization and the same chip editor; seniority and work modes
the same checkbox group, now in its own component.

### D3 - List, and an editor that replaces it

As on the Profile page (044): cards showing the name, role and
location, and the chosen criteria, with Edit and Delete; New and Edit
open the full form in place of the list.

### D4 - Flag and dev-only mock, as for 040-045

`SAVED_SEARCHES_FEATURE_ENABLED` keeps Discover on "coming soon" in
built images; a mock seeds one example search in the dev server.

## Proposed Change

| File | Change |
| --- | --- |
| `services/savedSearches/*` | types, CRUD, normalization, dev-only mock |
| `features/discover/*` | flag, hook, editor |
| `pages/discover/DiscoverPage.tsx` | list and states |
| `routes/modules/discoverRoute.tsx` | page or "coming soon" by flag |
| `features/profile/components/CheckboxGroup.tsx` | moved out of 045's section for reuse |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

Searches render; create and edit save the normalized criteria; delete;
the empty state explains what a saved search is; a name is required;
errors; service, mock, hook, and route (flag on and off).

## Implementation Order

Service and mock, hook, editor and page, route and translations;
`npm run frontend:verify`; dev server and built image checks.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, the dev server with
the mock at phone and desktop width, and the built image hiding it.

## Scope Boundaries

Out of scope: running a search, calling OpenAI or a job provider,
schedules, import candidates (047), prefilling a search from the user's
preferences, and the backend in this change.

## Completion Rules

The frontend can merge behind the flag. The task completes once the
backend lands and the mock and flag are removed.

## Acceptance Criteria

- [ ] Discover lists, creates, edits, and deletes saved searches.
- [ ] The empty state explains saved searches.
- [ ] No AI or provider call is made.
- [ ] The backend exists and the mock and flag are removed.
