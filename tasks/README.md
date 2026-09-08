# Tasks

Execution-ready work units. There are two kinds, numbered in separate
sequences so they never collide:

- [`roadmap/`](./roadmap/README.md) - roadmap tasks generated from the
  phase plan in `../docs/backlog/`, numbered `001` upward.
- [`bugs/`](./bugs/README.md) - defects found in review, testing, or use,
  numbered `bug-001` upward.

Each folder's README owns its own convention: file naming, numbering,
template, branch name, and commit prefix.

## Rules For Both

- Do one at a time.
- Read `../AGENTS.md` and `../docs/context.md` first.
- Read `../frontend/AGENTS.md` before frontend changes.
- Read `../backend/AGENTS.md` before backend changes.
- Keep the scope tight. The task or bug file is the execution boundary.
- Run the verification in the file before marking it complete
  (`../AGENTS.md` §3).
- Update the file's checkboxes only when the behaviour is implemented
  and verified (`../AGENTS.md` §5).

## Choosing Between Them

File roadmap work in `roadmap/`. File a defect in `bugs/` when it is
already-shipped behaviour that is wrong, and the fix is out of scope for
the change that found it, needs its own decision, or is larger than that
change. A cheap, in-scope defect found during review is fixed in that
change rather than filed.
