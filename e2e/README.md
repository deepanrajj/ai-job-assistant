# Browser E2E

Playwright journeys that drive the real app in Chromium against a
running stack. They prove what the Vitest and backend suites cannot:
that the frontend and backend talk to each other and that data
survives a reload. Background and decisions:
[`docs/business/e2e-testing-strategy-plan.md`](../docs/business/e2e-testing-strategy-plan.md)
and the
[task 080 plan](../docs/business/080-add-playwright-harness-and-first-journey-plan.md).

This suite is not part of `npm run verify`, and its CI job,
`Browser E2E`, is not a required check.

## Run It

From the repository root, once:

```bash
npm run e2e:install
```

Then start a stack and run the suite:

```bash
npm run dev:compose   # or: npm run dev   (local Kubernetes)
npm run e2e:test
```

Both runtimes serve the app on `http://localhost:30080`, the default
target. A failed run prints a trace path; `npm run report --prefix e2e`
opens the HTML report.

## Targets

The suite never hardcodes a host. `playwright.config.ts` resolves the
URL in this order:

1. `E2E_BASE_URL`, if set.
2. `E2E_ENV`: `cluster` (`http://localhost:30080`) or `dev`
   (`http://localhost:5173`). Any other value fails the run.
3. `cluster`.

`dev` is the Vite dev server. It starts only the frontend and proxies
`/api` to port 4000, so it still needs a backend: run
`npm run dev:local`, or `npm run dev:frontend` and
`npm run dev:backend` separately.

Setting a variable for one command differs by shell:

```bash
E2E_ENV=dev npm run e2e:test            # bash, zsh, Git Bash
```

```powershell
$env:E2E_ENV = 'dev'; npm run e2e:test  # PowerShell; persists for the session
```

## Test Data

The suite writes real rows to a real database, so every spec follows
the same rules:

- **Unique names.** A test names its data `E2E <random id>` and asserts
  only on that name, so it never collides with your own jobs, another
  test, or an earlier run.
- **Find rows by searching.** The jobs list shows five rows per page
  and does not put new jobs first, so specs narrow it with the `Search`
  box instead of reading page one.
- **Clean up through the API.** An `afterEach` deletes the test's jobs
  with `DELETE /api/jobs/{id}`, so a local cluster database does not
  fill up. CI discards its database with `compose down -v` regardless.

There is no database reset: on the `cluster` target it would delete
your own data.

## Safety Guard

`global-setup.ts` refuses to run unless the target host is
`localhost`, `127.0.0.1`, or `[::1]`. To run against anything else,
name the host explicitly:

```bash
E2E_ALLOWED_HOSTS=staging.example.com E2E_BASE_URL=https://staging.example.com npm run e2e:test
```

Only do that for an environment whose data may be created and deleted.

## Writing Specs

- Navigate with relative paths: `page.goto('/jobs')`.
- Query by role, label, and text. No `data-testid`.
- No fixed sleeps. Use web-first assertions such as `toBeVisible()`,
  which wait on their own.
- No per-environment branches inside a test; differences belong in
  configuration.
