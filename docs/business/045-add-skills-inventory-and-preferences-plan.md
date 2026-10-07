# Task 045 - Add Skills Inventory And Preferences Plan

Status: In progress

## Purpose

Record what the user can do and what they are looking for - a skills
inventory, and preferred roles, locations, work modes, seniority, and
keywords - on the Profile page, as clean lists that Discover (046) and
later AI matching can read. No matching, no taxonomy, no provider.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Normalization, service, mock, hook, tag editor, section, route, flag | Done; `npm run frontend:verify` passed (775 tests) |
| Backend | `GET`/`PUT /api/profile/preferences` (D1), normalizing as D2 | Not started (user-written) |
| API collection | `Preferences` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **Normalization** tests: trimming, inner whitespace, case-insensitive
  duplicates keeping the first spelling and order, value and list caps.
- **Accessibility**: a test first failed because the chip list and its
  input shared the name "Skills"; the list is now "Skills added", so
  every control has a distinct name.
- **Dev server with the mock** (port 5173) at 375 px and 1280 px: a
  skill added with Enter, saved, and "Saved <date>" shown; chips and
  checkboxes wrap with no horizontal scroll; no request reached
  `/api/profile/preferences`.
- **Built image** (compose, port 30080): Profile shows "Coming soon",
  with no preferences request.
- **PR review fixes** (PR #63): a value that cannot be added - over
  60 characters, a duplicate in any case, or past 50 in a list - stays
  in the input with the reason instead of vanishing, and a full list
  says so; Save adds text typed but not added, and saves nothing while
  any such text cannot be added. A second review: the section now shows on
  its own when only its flag is on, as D4 intended; a `null` list from
  the API is read as empty; stored values are never dropped on save
  (D2).

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md` (no locked model covers this; it lists the planned
  API area "resume profiles, skills inventory, and job preferences")
- `tasks/roadmap/045-add-skills-inventory-and-preferences.md`
- `docs/business/044-add-profile-resume-library-plan.md` (same page)
- `docs/business/product-improvements-and-recommendations-plan.md`
  (R-07 plans a job `workMode`; the values here match it)

## Current State

Read on `feat/task-044-add-profile-resume-library` at `2ecb148`
(stacked on PR #62).

- The Profile page holds 044's resume profile library behind
  `PROFILES_FEATURE_ENABLED`.
- No skills or preferences model exists, and none is locked in
  `docs/context.md`; the task asks for one.
- No authentication: there is one user, so there is one preferences
  record (task 052 later scopes it to a user).

## Decisions

### D1 - One preferences record, read with `GET` and replaced with `PUT`

`GET /api/profile/preferences` returns the record (empty lists when
nothing was saved yet, never 404); `PUT /api/profile/preferences`
replaces it. Body and response:

```text
skills       string[]
roles        string[]   target role titles, e.g. "Backend Engineer"
locations    string[]   e.g. "Berlin", "Remote EU"
workModes    (REMOTE | HYBRID | ONSITE)[]
seniority    (JUNIOR | MID | SENIOR | LEAD)[]
keywords     string[]
updatedAt    timestamp, response only; null before the first save
```

A new `ProfilePreferences` model, added to `docs/context.md` on
completion. `userId` joins it with task 052.

Rejected: putting preferences inside a resume profile's `profileJson`.
A user has several profiles but one set of preferences, and Discover
must read them without choosing a profile.

### D2 - Normalized lists

Every free-text list is normalized the same way, in the browser and
again by the API: trim, collapse inner whitespace, drop empty values,
and drop case-insensitive duplicates keeping the first spelling and the
user's order. Each value is at most 60 characters; each list at most 50
values. "react", "React " and "REACT" are one skill.

The browser applies the limits when a value is added, and says why it
refuses one. It never deletes a stored value the user did not remove: a
value outside the limits, or a work mode or seniority it does not offer,
is shown and saved back unchanged. A received list that is missing or
`null` is treated as empty.

Rejected: lower-casing everything (the user's "TypeScript" is the
spelling to show) and sorting (the user's order can mean priority).

### D3 - A tag-list editor, checkboxes for the fixed sets

Free-text lists use one shared control: a labelled input with an Add
button (Enter also adds), and the values as a list of chips, each with
a remove button named after its value. Work modes and seniority are
checkbox groups in a `fieldset` with a `legend`. One Save button writes
the whole record; a status line says when it was last saved. An empty
list says "None yet" rather than rendering nothing.

### D4 - Same page and flag pattern as 044, with its own flag

The section sits below the resume profiles. `PREFERENCES_FEATURE_ENABLED`
hides it in built images, independent of 044's flag, since the two
backends can land in either order; a dev-only mock stands in for the
endpoint.

## Proposed Change

| File | Change |
| --- | --- |
| `services/preferences/*` | types, `get`/`save`, normalization, dev-only mock |
| `features/profile/preferences.constants.ts` | flag, option lists, labels |
| `features/profile/useProfilePreferences.ts` | load and save |
| `features/profile/components/TagListEditor.tsx`, `ProfilePreferencesSection.tsx` | the UI |
| `routes/modules/profileRoute.tsx` | add the section when its flag is on |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

- Normalization: trimming, inner whitespace, case-insensitive
  duplicates keep the first spelling and order, length limits.
- Tag editor: add by button and Enter, duplicates ignored, remove by
  named button, empty state.
- Section: saved preferences display, editing and saving sends the
  normalized record, empty record renders cleanly, errors.
- Service, mock, hook, route.

## Implementation Order

Normalization, then service and mock, then hook and components, then
route and translations; `npm run frontend:verify`; dev server and built
image checks.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, the dev server with
the mock at phone and desktop width, and the built image hiding it.

## Scope Boundaries

Out of scope: AI matching, provider integration, a skill taxonomy or
autocomplete, skill levels, salary preferences (R-07), and the backend
in this change.

## Completion Rules

The frontend can merge behind the flag. The task completes once the
backend lands and the mock and flag are removed.

## Acceptance Criteria

- [ ] Skills can be added and removed; preferences for roles,
  locations, work modes, seniority, and keywords save and display.
- [ ] Lists are normalized; an empty record renders cleanly.
- [ ] The backend exists and the mock and flag are removed.
