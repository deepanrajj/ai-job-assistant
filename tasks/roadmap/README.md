# Roadmap Tasks

Execution-ready tasks generated from the phase roadmap in
`../../docs/backlog/`. Rules shared with bug tickets live in
`../README.md`.

## Convention

- Files live in `tasks/roadmap/<number>-<slug>.md`.
- Numbering is one sequence starting at `001`, mapped to phases below.
  Defects use a separate sequence in `../bugs/` and never consume a
  roadmap number.
- Use `../../templates/task-template.md` for new task files.
- Branch name: `feat/task-<number>-<slug>`.
- Commit message: `task-<number>: <one-line summary>`.
- Every task file carries a `Status:` line under its title, the same
  way bug files do. It starts at `Not started` and becomes `Completed`
  when the acceptance criteria are ticked. Tasks 001 to 009, 077 and
  078 were written before the field existed and had it backfilled;
  the template now supplies it, so no new file needs the same repair.
- A task with a plan links it from the same header block, and the
  plan's own `Status:` is kept in step with the task's.
- Each task has a matching checkbox in a `../../docs/backlog/` phase
  file. Tick it only when the behaviour is implemented and verified.

## Phase Mapping

- `001`-`019`: Phase 3 backend foundation.
- `020`-`035`: Phase 4 frontend/backend integration.
- `036`-`050`: Phase 5 core and advanced non-AI workflows.
- `051`-`058`: Phase 6 authentication, user-owned data, and AI billing foundation.
- `059`-`067`: Phase 7 integrated paid AI workflows.
- `068`-`081`: Phase 8 portfolio and production polish.

A task's number is its identity, not its priority. `077` to `081` are
testing infrastructure grouped with `068`, but several of them are
meant to run well before the rest of phase 8; the ordering lives in
`../../docs/business/e2e-testing-strategy-plan.md`.

## Rules

- The task file is the execution boundary. Do not infer extra scope from
  a phase checklist item.
- Larger tasks get a plan under `../../docs/business/` first, linked from
  the task file.
- A defect found while working a task is fixed in that change when it is
  cheap and in scope. Otherwise file it in `../bugs/`.

## Deferred Ideas

The previous pgvector, embedding, job chunk, and RAG tasks are deferred.
They are not execution-ready tasks because the final product direction
prioritizes workflow-integrated AI, duplicate detection, paid access,
and editable application materials first.
