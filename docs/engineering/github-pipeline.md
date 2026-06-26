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

The CI workflow currently uses `windows-latest` because the root backend
npm scripts call `gradlew.bat`. A later cleanup can make the root
scripts cross-platform and move CI to Linux runners.

### Docker Build

File:

```text
.github/workflows/docker-build.yml
```

Runs on the same pull request and `main` events as CI.

Job:

- `Docker Build`
  - runs `npm run docker:build`
  - verifies both backend and frontend Docker images can be built
  - does not push images to a registry

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
