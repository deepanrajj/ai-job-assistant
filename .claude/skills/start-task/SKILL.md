---
name: start-task
description: Start work on a Smart Job Tracker task or bug file from tasks/roadmap/ or tasks/bugs/ - sync main, branch, write the plan in docs/business/, then implement. Backend work is taught step by step for the user to write; frontend work is implemented outright. Use when the user says "start task 010", "lets start tasks/bugs/bug-002-...", "work on task 012", or names a task or bug file to begin.
---

# Start A Task

Takes one task file (`tasks/roadmap/<n>-<slug>.md`) or bug file
(`tasks/bugs/bug-<n>-<slug>.md`) from unstarted to verified and ready to
commit.

## Read first, every time

1. The task or bug file itself. It is the scope boundary - not the
   backlog item it came from.
2. `AGENTS.md`.
3. `docs/context.md`.
4. `backend/AGENTS.md` or `frontend/AGENTS.md`, whichever the task
   touches.
5. The most recent plan in `docs/business/` for a comparable task. It
   shows the house style far better than any description of it.

## Phase 1 - Branch

```bash
git checkout main && git pull --ff-only
```

Branch naming, from `tasks/bugs/README.md` and `AGENTS.md` section 2:

| Kind | Branch | Commit prefix |
| --- | --- | --- |
| Roadmap task | `feat/task-<n>-<slug>` | `task-<n>: <summary>` |
| Bug | `fix/bug-<n>-<slug>` | `bug-<n>: <summary>` |

## Phase 2 - Plan

Write a plan in `docs/business/` before any code. Roadmap tasks use
`<nnn>-<slug>-plan.md`; bugs use `bug-<nnn>-<slug>-plan.md`. Link it
from `docs/business/README.md`.

Follow the section order of the existing plans: Purpose, Authoritative
References, Current State, Decisions, Proposed Change, Tests,
Implementation Order, Verification Plan, Scope Boundaries, Completion
Rules, Acceptance Criteria.

The plan is where judgement is recorded, so:

- Every decision states what was chosen **and what was rejected and
  why**. A plan that lists only the winner is not a decision record.
- Consequences the task file did not anticipate get their own decision
  entry. They are usually the largest part of the work.
- Anything asserted about how a framework or compiler behaves is
  **verified before it is written down**. Compile a throwaway probe,
  read the library source, run the query. Delete the probe afterwards.
  Say in the plan that it was verified.
- Order the implementation so that failures land where they teach
  something, and say what failure to expect at each step.

Wrap prose at roughly 72 characters to match the other documents, and
end the file with a newline.

## Phase 3 - Implement

### Backend: guide, do not write

The user is learning Kotlin, Spring Boot, and Postgres. Writing the code
for them defeats the purpose. For each step:

1. **Teach the concept first.** Why this exists, what the framework does
   underneath, what breaks without it. Two or three paragraphs, concrete
   about this codebase, not a tutorial rehash.
2. **Give a spec, not code.** A table of members, signatures, and
   annotations, or a description of the change per file. Short
   illustrative fragments are fine where prose would be unclear; a
   complete, paste-ready file is not.
3. **Stop and let the user write it.**
4. **Review line by line** when they say it is done. Name each finding,
   explain the underlying rule, and point at the file and line. Frame
   mistakes as lessons, not corrections.
5. Run the narrow check (`npm run backend:test`, or a single test class)
   and read the output together.

Claude may run read-only inspection and any verification command at any
time. Claude writes backend production code only when the user
explicitly delegates it ("write it for me", "can you complete this").

Recurring traps worth checking on review: IDE auto-imports pulling in the
wrong symbol (`kotlin.test.Test` instead of
`org.junit.jupiter.api.Test`, the wrong `UUID`), Kotlin constructor
properties versus class-body properties, `!!`, wildcard imports, and
missing trailing newlines.

### Frontend: implement it

Take the work over end to end - components, hooks, translations for both
`en` and `de`, and Vitest and React Testing Library tests - then run
`npm run frontend:verify` and report the result. Follow
`frontend/AGENTS.md`.

### Tests

Write the test before the production code when the task is a bug fix,
and **watch it fail**. `tasks/bugs/README.md` requires it. A regression
test that passes against the unfixed code proves nothing, so run it
against the unfixed code and quote the failure.

## Phase 4 - API requests

If the task adds or changes an HTTP endpoint, update the request
collection in the same change. The backend already publishes OpenAPI at
`/api/v3/api-docs` with Swagger UI at `/api/swagger-ui.html`, so prefer
importing that into Postman over hand-writing a collection - an import
cannot drift from the controllers, and a checked-in collection can.

Keep hand-maintained requests only where they add something the spec
cannot express: an ordered happy-path flow, saved example bodies, or
variables chaining one response id into the next request.

Never commit real keys or tokens. Environment files hold placeholders.

## Phase 5 - Verify

```bash
npm run backend:verify
```

```bash
npm run frontend:verify
```

```bash
npm run verify
```

Narrowest check while iterating, the app-level check before finishing,
`npm run verify` when the change spans both.

Gradle on this machine needs a JVM option to start at all, and it is
**already set globally**. Check before setting it:

```bash
echo $JAVA_TOOL_OPTIONS
```

If that prints `-Djdk.net.unixdomain.tmpdir=C:\tmp`, run Gradle with no
prefix. Prefixing it again under Bash loses the backslash, silently
replacing the correct path with `C:tmp`. If a prefix is ever genuinely
needed, single-quote the value. See
`docs/engineering/local-runtime-environment.md`.

Backend verification enforces 100 per cent line **and** branch coverage.
Plan for it: any method that no test executes fails the build, including
ones the framework would normally call for you.

## Phase 6 - Close out

Only after verification passes:

- Tick the acceptance criteria in the task or bug file and set its
  status.
- Roadmap tasks: update the phase file in `docs/backlog/` and its
  recommended-next-task line.
- Bugs: move the entry from Open to Fixed in `tasks/bugs/README.md`.
- Mark the plan `Completed` and add a verified-state section saying what
  was built and what the verification run reported.
- Update `docs/context.md` only when the change altered something it
  documents.

Stop there. Do not commit or push unless the user asks.

## Boundaries

- One task file at a time. The task file is the scope, not the backlog
  entry that spawned it.
- No drive-by refactors, no unrelated formatting, no new libraries.
- Something worth fixing but out of scope becomes a bug file from
  `templates/bug-template.md`, not a quiet extra commit.
- If the correct behaviour is genuinely unclear, ask rather than guess.
