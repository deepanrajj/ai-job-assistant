# AGENTS.md - Agent Instructions

Mandatory for this repository. All implementing and reviewing agents
must follow this file before changing code, docs, scripts, tests, or
infrastructure.

Authoritative companion docs:

- `docs/context.md` - product vision, architecture, stack, locked decisions.
- `docs/backlog/README.md` - phase roadmap and execution backlog.
- `tasks/` - numbered implementation tasks.
- `templates/task-template.md` - canonical task file template.
- `docs/business/` - product and feature planning notes.
- `docs/engineering/` - engineering decisions, testing notes, and runbooks.

If code and documentation disagree, inspect the code first, then update
the documentation in the same change when the task requires it. If a
task explicitly references `docs/context.md`, treat that context as the
product source of truth and stop to ask before changing locked
decisions.

---

## 0. Global Rules

- Make the smallest change that solves the task.
- Do not perform drive-by refactors, unrelated formatting, or
  speculative abstractions.
- Inspect existing patterns and tests before adding new structure.
- Do not introduce new libraries unless the task explicitly asks for
  them.
- Add or update tests for production behavior changes in the affected
  layer.
- Do not delete, skip, weaken, or rewrite tests only to make the suite
  pass.
- Do not commit secrets, API keys, local environment files, build
  output, coverage output, or generated logs.
- Keep modified files scoped to the task.
- Ensure every modified text file ends with a newline.

## 1. Project Structure

```text
frontend/   React + Vite frontend
backend/    Kotlin + Spring Boot backend
infra/      Docker, Nginx, Kubernetes, and local runtime scripts
docs/       context, setup, architecture, backlog, and planning docs
tasks/      numbered implementation tasks
templates/  reusable task templates
```

Read the more specific instructions before editing inside an app:

- `frontend/AGENTS.md` before editing `frontend/`.
- `backend/AGENTS.md` before editing `backend/`.

More specific instructions win for their folder. `docs/context.md`
wins for product and architecture intent.

## 2. Task Execution

- Execute exactly one numbered task at a time when a task file is
  present.
- Task files live in `tasks/<number>-<slug>.md`.
- Do not infer extra scope from a phase checklist item. The task file
  is the execution boundary.
- For multiple sequential tasks, complete one task before starting the
  next.
- Preferred commit message format:

```text
task-<number>: <one-line summary>
```

Examples:

```text
task-001: add postgresql docker service
task-020: add frontend job service
```

## 3. Verification

Use the narrowest relevant verification while iterating, then run the
full project verification before finalizing a code change.

```bash
npm run frontend:verify
npm run backend:verify
npm run verify
```

Documentation-only changes do not require unit tests, but links,
numbering, and Markdown should still be checked manually.

## 4. Test Preservation

- If existing tests fail after a change, investigate before modifying
  tests.
- Existing tests may change only when expected behavior intentionally
  changed.
- Do not use skipped tests, disabled tests, weakened assertions, or
  sleeps to hide failures.
- If the correct behavior is unclear, stop and ask.

## 5. Documentation Rules

- Keep `docs/context.md` concise and authoritative.
- Do not duplicate long context across README files.
- Update task checkboxes only when the behavior is implemented and
  verified.
- Keep phase backlog files as roadmap summaries.
- Keep `tasks/` as execution-ready work units.

## 6. PR Review Mode

When asked to review code, stay in review mode unless the user
explicitly asks for fixes.

Review findings should focus on:

- correctness bugs
- test gaps
- security or secret handling issues
- accessibility regressions
- API contract drift
- scope drift from the task file
- violations of `frontend/AGENTS.md`, `backend/AGENTS.md`, or
  `docs/context.md`

Use this format for review findings:

```text
**[P1] Short title**
File: `path/to/file:line`
Rule: AGENTS.md section or app AGENTS.md section
Issue: One or two sentences.
Suggested fix: One or two sentences.
```

Severity:

- `P1` - blocking correctness, safety, security, or scope issue.
- `P2` - should fix before merge.
- `nit` - optional cleanup.

Do not approve while any `P1` finding remains.
