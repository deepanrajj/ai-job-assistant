# Task 077 - Make Backend Scripts Cross-Platform Plan

Status: Completed

Written after implementation, not before. `tasks/roadmap/README.md`
asks for a plan on larger tasks first, and this one was treated as a
small mechanical change until it turned out not to be. Recording the
decisions afterwards is worth doing, but it is a weaker artifact than a
plan that shaped the work: the alternatives below were weighed during
implementation rather than ahead of it, and the section on what the
work uncovered exists precisely because none of it was predicted.

## Purpose

Let the backend npm scripts run on Windows and Linux from one
definition, so the backend CI job can leave `windows-latest`.

This is a prerequisite rather than an improvement on its own. Task 078
needs a Linux PostgreSQL container, and GitHub's Windows runners
provide Docker for Windows containers.

## Authoritative References

- `AGENTS.md`
- `backend/AGENTS.md`
- `docs/business/e2e-testing-strategy-plan.md` (work unit A)
- `tasks/roadmap/077-make-backend-scripts-cross-platform.md`
- `docs/engineering/github-pipeline.md`

## Current State Before The Change

- Seven scripts in the root `package.json` hardcoded the Windows
  launcher, for example
  `"backend:test": "cd backend && .\\gradlew.bat test"`. Five were the
  `backend:*` verification scripts; `dev:backend` and
  `dev:backend:debug` were the other two.
- `gradlew.bat` does not exist on Linux, so `npm run backend:verify`
  only ran on Windows.
- `.github/workflows/ci.yml` therefore pinned the backend job to
  `windows-latest`, which `docs/engineering/github-pipeline.md`
  recorded as a known limitation with a note that "a later cleanup can
  make the root scripts cross-platform and move CI to Linux runners".
- `backend/gradlew` was mode `100644` in the Git index.

## Decisions

### D1: a Node dispatch helper, not a bare launcher name

`infra/scripts/run-gradle.mjs` selects the launcher for the current
platform, and all seven scripts call it.

Rejected: putting `./gradlew` directly in the scripts. npm runs scripts
through `cmd.exe` on Windows, where that path does not resolve.

Rejected: leaving the scripts alone and having CI invoke `./gradlew`
itself. That splits how the backend is built locally and in CI, so a
Gradle argument added in one place silently fails to apply in the
other.

The helper mirrors `infra/scripts/run-frontend-tool.mjs`, which already
performs exactly this dispatch for `eslint` and `prettier`. Following
an existing pattern was worth more than picking the theoretically
neatest mechanism.

### D2: keep the launcher path relative

The first implementation resolved the launcher to an absolute path.
That was wrong; see the next section. The launcher is now
`.\gradlew.bat` relative to the working directory, so no path from the
filesystem root can reach the command line.

### D3: build the Windows command line explicitly

`spawnSync` with an argument array and `shell: true` performs no
escaping - it concatenates, which is what Node's `DEP0190` deprecation
warns about. Windows now receives a command line this script builds and
quotes itself, through `cmd.exe /d /s /c` with
`windowsVerbatimArguments`.

`shell: true` cannot simply be dropped: Node has refused to spawn
`.bat` files without a shell since the 20.12 security fix, which is why
the first implementation reached for it.

POSIX keeps the argument array and no shell, so it needs no quoting at
all.

### D4: fix the executable bit

`backend/gradlew` is now `100755` in the Git index.

### D5: move the backend CI job to `ubuntu-latest`

Justified on its own terms - faster and cheaper - independently of the
Testcontainers question that motivated the task.

## What The Work Uncovered

None of this was anticipated, which is the honest argument for having
written a plan first.

**The executable bit was the half that mattered.** `backend/gradlew`
was committed non-executable. Cross-platform scripts alone would still
have failed on Linux with permission denied, on a file that is plainly
present. The task file's Pre-Execution step caught it before any code
changed; the strategy plan had not considered it.

**An absolute launcher path broke Windows checkouts containing a
space.** With `shell: true` and no quoting, `C:\Users\John Smith\...`
made `cmd.exe` try to execute `C:\Users\John`. Every backend script
failed. This was a regression introduced by the task - the previous
`cd backend && .\gradlew.bat` used a relative path and was immune - and
neither CI nor local runs could catch it, because CI is Linux and the
development checkout has no space in its path.

**Three further quoting defects followed**, each found by review rather
than by tests: an argument containing a space was split in two; an
empty argument disappeared entirely; and an argument that both needed
quoting and ended in a backslash escaped its own closing quote and
swallowed the argument after it. That last shape is ordinary - Windows
Explorer copies paths with a trailing separator, and the directories
containing spaces are the same ones that trigger quoting.

**One difference remains and is documented rather than fixed.** cmd
expands `%NAME%` inside arguments, including inside double quotes, so a
value holding `%TEMP%` arrives expanded on Windows and literal on
POSIX. Avoiding it means avoiding cmd, which is not possible while the
launcher is a `.bat` file.

## Verification

`npm run verify` passes on Windows through the helper.

Failure propagation was checked explicitly: a wrapper that swallowed
exit codes would turn CI green on broken builds, so a bogus Gradle task
was run and confirmed to exit non-zero.

The quoting was verified from a directory literally named
`dir with space`, against a harness reproducing `gradlew.bat`'s `%*`
forwarding, covering an argument with a space, one with quotes, one
with a backslash before a quote, one ending in a backslash, an empty
one, and a plain one.

The CI run is the other half, and it is what the corresponding
acceptance criterion was held open for. Backend Verify passed on
pull request 13 in 2m18s, confirmed through the GitHub API as
`runner_os: ubuntu-latest` rather than inferred from the workflow file.

## Scope Boundaries

- No Gradle build logic changed.
- No new libraries.
- No change to what the scripts run, only to how they are launched.

## Verified State

Merged as pull request 13.

- Seven scripts route through `infra/scripts/run-gradle.mjs`.
- `backend/gradlew` is `100755`.
- The backend CI job runs on `ubuntu-latest`.
- `docs/engineering/github-pipeline.md` records the two things that
  must stay true: the executable bit, and new scripts calling the
  helper rather than a launcher directly.

A note for whoever changes this file next. Windows correctness here
rests entirely on local testing and review, because CI is Linux and
never executes that branch. Three of the four defects in this task
lived on the Windows side for exactly that reason, and the asymmetry
has not gone away.
