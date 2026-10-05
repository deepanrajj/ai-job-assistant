# Task 044 - Add Profile Resume Library Plan

Status: In progress

## Purpose

Let a user keep several resume profiles - a base one and versions aimed
at frontend, backend, or full-stack roles - each with a summary,
experience highlights, education, links, and notes, and manage them on
the Profile page. Every highlight, education line, and link gets an
identifier that never changes, so a later AI draft can cite exactly
which entry a claim came from. No AI, no export, no resume styling.

## Progress

| Steps | Layer | State |
| --- | --- | --- |
| Frontend | Entry helpers, service, mock, hook, page, route, flag | Done; `npm run frontend:verify` passed (756 tests) |
| Backend | `/api/resume-profiles` (D4) | Not started (user-written) |
| API collection | `Profiles` folder and `api:test` allowlist | Not started |
| - | **Remove the temporary mock and feature flag** | Required once the backend lands |

### Verified so far

- **Entry ids:** helper tests show an added entry gets a new id and
  that editing, moving up or down, and removing other entries keep every
  id; a page test edits a highlight, moves it down, saves, and checks
  the payload carries the same ids in the new order.
- **Dev server with the mock** (port 5173), checked with a one-off
  Playwright script at 375 px and 1280 px: the seeded base profile
  lists with its counts; the editor opens, "Move Highlight 1 down"
  reorders, and nothing scrolls sideways (page width 375 on the phone).
  No request reached `/api/resume-profiles`.
- **Built image** (compose, port 30080): Profile shows "Coming soon"
  and makes no profile request.

### Backend contract the frontend expects

- `GET /api/resume-profiles` - plain array of
  `{ id, name, profile, createdAt, updatedAt }`
- `POST /api/resume-profiles`, `PUT /api/resume-profiles/{id}` - body
  `{ name, profile }`; `profile` is D1's document, stored as
  `profileJson`; reject a link that is not `http(s)` and duplicate entry
  ids within a profile
- `DELETE /api/resume-profiles/{id}` - 204
- `PROFILE_NOT_FOUND` for an unknown id

## Authoritative References

- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`
- `docs/context.md` (`ResumeProfile` is `id, userId, name, profileJson,
  createdAt, updatedAt`; this plan keeps it)
- `tasks/roadmap/044-add-profile-resume-library.md`
- `docs/business/product-improvements-and-recommendations-plan.md`
  ("AI Claims Need Profile Evidence": stable entry identifiers)
- `docs/business/040-add-reminders-plan.md` (flag and dev-mock pattern)

## Current State

Read on `feat/task-042-add-calendar-view` at `0ef20bb` (this branch is
stacked on PR #61).

- **Profile** (`/profile`) renders `ComingSoonPage`.
- **No profile model** exists. Task 045 (skills and preferences) also
  lands on this page later.
- **No authentication** yet, so `userId` cannot be filled (task 051).

## Decisions

### D1 - Keep the locked model: content lives in `profileJson`

The API stores `name` as a column and everything else as one JSON
document, `profileJson`, exactly as `docs/context.md` locks it. Its
shape, owned by the frontend and validated by the backend:

```text
targetRole   BASE | FRONTEND | BACKEND | FULL_STACK | OTHER
summary      text
highlights   [{ id, text }]          experience highlights
education    [{ id, text }]
links        [{ id, label, url }]    url must be http(s)
notes        text
```

`userId` stays out until authentication (task 051) adds ownership.

Rejected: a column per field, or child tables for entries. Ordered
lists of small entries read and write as one document, the model is
locked, and nothing queries inside a profile.

### D2 - Entry identifiers are generated once and never rewritten

A new highlight, education line, or link gets a `crypto.randomUUID()`
id in the browser when it is added. Editing its text, or moving it up
or down, keeps the id; only deleting the entry removes it. The backend
stores the ids as given and rejects a duplicate id within a profile.
This is what lets a later AI run reference "highlight `a1b2…`" and
still find it after the user reworded or reordered it.

Rejected: positional ids (index), which reordering changes, and ids
derived from the text, which editing changes.

### D3 - One page: profile list, and an editor that replaces it

The Profile page lists profiles as cards (name, target role, summary
excerpt, and entry counts) with Edit and Delete, plus "New profile".
Edit opens the full editor in place of the list; Save writes the whole
profile (`PUT`, full replacement) and returns to the list, Cancel
discards. Entries have Move up, Move down, and Remove buttons with
names that include the entry, so they work by keyboard and screen
reader without drag and drop.

Rejected: drag-and-drop reordering, which needs a library or a lot of
accessibility work, for a list of a few items.

### D4 - API: `/api/resume-profiles`

`GET` (list), `POST`, `PUT /{id}`, `DELETE /{id}`; body
`{ name, profile }` where `profile` is the D1 document; responses add
`id`, `createdAt`, `updatedAt`. Backend for the user, after 040-042.

### D5 - Frontend first, behind a flag, with a dev-only mock

As for 040-042: `PROFILES_FEATURE_ENABLED` keeps Profile on "coming
soon" in built images; a mock with one seeded base profile runs only
in the Vite dev server.

## Proposed Change

| File | Change |
| --- | --- |
| `services/profiles/*` | types, CRUD service, mapper, dev-only mock |
| `features/profile/*` | flag, entry helpers (add, edit, move, remove keep ids), `useResumeProfiles` |
| `pages/profile/*` | list, editor, states |
| `routes/modules/profileRoute.tsx` | page or "coming soon" by flag |
| `i18n/locales/en.json`, `de.json` | labels |

## Tests

- Entry helpers: adding generates a new id; editing, moving up and
  down keep every id; removing drops only that entry.
- Editor: edit text and reorder, then save sends the same ids in the
  new order.
- Page: profiles render; create, edit, delete; empty state inside a
  labelled region; invalid link blocks save; errors.
- Service, mock, hook, route (flag on and off).

## Implementation Order

1. Entry helpers and tests (the id guarantee is the point of the task).
2. Service, mock, hook.
3. Page, route, translations; `npm run frontend:verify`; dev server and
   built image checks.

## Verification Plan

Affected Vitest files, `npm run frontend:verify`, the dev server with
the mock at phone and desktop width, and the built image keeping
"coming soon".

## Scope Boundaries

Out of scope: AI extraction (062), export, resume styling, profile
version history, skills and preferences (task 045), choosing a profile
for an AI draft (064), and the backend in this change.

## Completion Rules

The frontend can merge behind the flag. The task completes once the
backend lands and the mock and flag are removed.

## Acceptance Criteria

- [ ] The Profile page lists, creates, edits, and deletes resume
  profiles with summary, highlights, education, links, and notes.
- [ ] Entry ids stay the same through edits and reordering.
- [ ] The empty state is accessible.
- [ ] The backend exists and the mock and flag are removed.
