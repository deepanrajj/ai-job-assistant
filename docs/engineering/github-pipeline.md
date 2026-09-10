# GitHub Pipeline

This project uses GitHub Actions for pull request verification and
Docker build validation.

## Workflows

### CI

File:

```text
.github/workflows/ci.yml
```

Runs on:

- pull request opened
- pull request updated with new commits
- pull request reopened
- pull request marked ready for review
- push to `main`

Jobs:

- `Frontend Verify`
  - installs root and frontend npm dependencies
  - runs `npm run frontend:verify`
- `Backend Verify`
  - installs root npm dependencies
  - configures Java 21
  - runs `npm run backend:verify`

Both jobs run on `ubuntu-latest`. The backend job used `windows-latest`
until task 077, because the root backend npm scripts called
`gradlew.bat` directly. They now go through
`infra/scripts/run-gradle.mjs`, which picks the Windows or POSIX Gradle
launcher for the current platform, so the same scripts run on a
developer's Windows machine and on a Linux runner.

Two things that must stay true for this to keep working:

- `backend/gradlew` keeps its executable bit in Git (`100755`). Without
  it, a Linux runner fails with permission denied even though the file
  is present.
- New backend scripts call the helper rather than a launcher directly.

### Docker Build

File:

```text
.github/workflows/docker-build.yml
```

Runs on the same pull request and `main` events as CI.

The name is now narrower than the job. It builds the images, then
starts the stack they describe and runs checks against it. The name is
kept because it is a required status check in branch protection below,
and renaming it would silently drop that requirement until somebody
re-selected the new name.

Job `Docker Build`, in order:

1. `npm run compose:config` - parses the compose file, interpolates
   every variable, and resolves both build contexts. It takes about a
   second, so it runs before the build that takes minutes.
2. `npm run docker:build` - builds the backend and frontend images. No
   registry is involved and nothing is pushed.
3. `docker compose ... up -d --wait` - starts the stack and blocks
   until every service healthcheck passes.
4. `npm run compose:smoke` - asserts properties of the running stack
   that no static check can see. See
   [the local runtime notes](./local-runtime-environment.md).
5. `npm run api:test` - runs the Postman collection in
   [`docs/api/`](../api/README.md) against the running stack with
   Newman, scoped to the `Health` and `Jobs` folders. The `AI` folder
   reaches a paid provider and must never run here.
6. Uploads the Newman JUnit and JSON reports as the `newman-api-report`
   artifact, on every outcome rather than only on failure.
7. Dumps compose logs on failure.
8. Tears the stack down with `down -v`, `if: always()`, so a failing
   check cannot leave a stack or a volume behind.

Steps 3 to 8 need Docker Compose on the runner, which `ubuntu-latest`
provides. Step 5 fetches a pinned Newman with `npx`; it is not a
project dependency.

## Branch Protection

Branch protection is configured in GitHub repository settings, not in a
normal workflow file. Configure it after the first workflow run so the
status checks are available to select.

Recommended settings for `main`:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Require these status checks:
  - `Frontend Verify`
  - `Backend Verify`
  - `Docker Build`
- Require conversation resolution before merging.
- Block force pushes.
- Block deletions.

Optional settings once the team/project grows:

- Require at least one approval.
- Require review from code owners.
- Require signed commits.
- Require linear history.

## Setup Steps In GitHub

1. Push the workflows to GitHub.
2. Open a pull request.
3. Wait for `Frontend Verify`, `Backend Verify`, and `Docker Build` to
   appear.
4. Go to repository settings.
5. Open `Branches`.
6. Add a branch protection rule for `main`.
7. Enable the recommended settings above.

No OpenAI API key is needed for these workflows.
