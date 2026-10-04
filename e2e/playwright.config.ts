import { defineConfig, devices } from '@playwright/test';

/**
 * Named local targets. Both serve the app and `/api` from one origin:
 * `dev` is the Vite dev server, which proxies `/api` to a backend on
 * port 4000; `cluster` is the Nginx front end that Kubernetes and Docker
 * Compose both publish on 30080. See D4a in
 * `docs/business/e2e-testing-strategy-plan.md`.
 */
const TARGETS = {
  cluster: 'http://localhost:30080',
  dev: 'http://localhost:5173',
} as const;

type TTargetName = keyof typeof TARGETS;

const DEFAULT_TARGET: TTargetName = 'cluster';

const isTargetName = (value: string): value is TTargetName => value in TARGETS;

/**
 * Resolves the URL the suite runs against: `E2E_BASE_URL` first, then
 * the named target in `E2E_ENV`, then `cluster`. An unknown `E2E_ENV`
 * fails instead of falling back, so a typo cannot quietly run the suite
 * against the wrong stack.
 */
const resolveBaseUrl = (): string => {
  const explicitUrl = process.env.E2E_BASE_URL;

  if (explicitUrl) return explicitUrl;

  const targetName = process.env.E2E_ENV ?? DEFAULT_TARGET;

  if (!isTargetName(targetName))
    throw new Error(
      `Unknown E2E_ENV "${targetName}". Use one of: ${Object.keys(TARGETS).join(', ')}, ` +
        'or set E2E_BASE_URL.',
    );

  return TARGETS[targetName];
};

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: resolveBaseUrl(),
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
