# Task 077 - Make Backend Scripts Cross-Platform

Status: Completed

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- Every backend script in `package.json` hardcodes the Windows
  launcher, for example
  `"backend:test": "cd backend && .\\gradlew.bat test"`.
- `gradlew.bat` does not exist on Linux, so `npm run backend:verify`
  only runs on Windows.
- That is why `.github/workflows/ci.yml` pins the backend job to
  `windows-latest`, which is slower and more expensive than
  `ubuntu-latest`.
- GitHub's Windows runners provide Docker for Windows containers, so
  the Linux PostgreSQL image that task 078 needs is not expected to run
  there. This task unblocks that one.

Related docs:

- `../../docs/business/e2e-testing-strategy-plan.md` (work unit A)
- `../../docs/business/077-make-backend-scripts-cross-platform-plan.md`

## Goal

After this task:

- `npm run backend:verify` and every narrower backend script run on
  Windows and Linux without change.
- The backend CI job runs on `ubuntu-latest`.
- Nothing about local Windows development gets worse.

## Scope

In scope:

- The five backend scripts in the root `package.json`.
- The backend job's `runs-on` in `.github/workflows/ci.yml`.
- Any documentation that names `gradlew.bat` as the way to run backend
  checks.

Out of scope:

- The `dev:backend` and `dev:backend:debug` scripts are developer
  conveniences, not verification. Change them only if the same fix
  applies for free.
- No Gradle build logic changes.
- No new libraries. Solve this with the launchers already in `backend/`.
- No unrelated refactors or formatting.

## Pre-Execution

Before changing files:

1. Confirm `backend/gradlew` exists alongside `backend/gradlew.bat` and
   is executable in the repository index (`git ls-files -s`).
2. Confirm which scripts are affected.
3. Decide the selection mechanism and record why in the commit.
4. Verify the claim about Linux containers on Windows runners before
   relying on it as the justification.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Implementation boundaries:

- Reuse existing naming, structure, and patterns.
- Keep changes minimal.
- Update docs only when documented behaviour changes.

Steps:

1. Make the backend scripts select the right Gradle launcher for the
   platform. Options, cheapest first: invoke `gradlew` and let Git's
   executable bit and the shebang work on Linux while npm resolves
   `gradlew.bat` on Windows; or add a small Node wrapper under
   `infra/scripts/` in the style of `run-frontend-tool.mjs`, which the
   repository already uses for exactly this kind of dispatch.
2. Confirm `backend/gradlew` has its executable bit set in Git. If it
   does not, set it with `git update-index --chmod=+x`.
3. Change the backend job in `.github/workflows/ci.yml` to
   `runs-on: ubuntu-latest`.
4. Update any documentation that instructs readers to run
   `gradlew.bat` directly.

## Data And Contracts

Not applicable. No API, schema, storage, or environment variable
changes.

## Tests

This task changes how existing checks are invoked, not product
behaviour, so it adds no test.

Required verification instead:

- Every backend script runs locally on Windows.
- The backend CI job passes on `ubuntu-latest` in the pull request that
  makes the change. That run is the test.

Rules:

- Use existing test infrastructure.
- Do not skip tests.
- Do not weaken assertions.

## Validation

```bash
npm run backend:verify
```

The CI run on the pull request is the other half; both must be green.

## Acceptance Criteria

- [x] Backend scripts run unchanged on Windows and Linux.
- [x] The backend CI job runs on `ubuntu-latest` and passes. Confirmed
      on pull request 13: `runner_os: ubuntu-latest`, success in 2m18s.
- [x] `backend/gradlew` is executable in the Git index.
- [x] No Gradle build logic changed.
- [x] No new libraries.
- [x] Docs naming `gradlew.bat` are updated.
- [x] No unrelated files are changed.

## Commit

```text
task-077: make backend scripts cross-platform
```
