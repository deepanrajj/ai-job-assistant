import type { FullConfig } from '@playwright/test';

/**
 * Hosts the suite may run against without being told to. The suite
 * creates and deletes real jobs, so anything else has to be named in
 * `E2E_ALLOWED_HOSTS` (comma-separated hostnames) first.
 */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Refuses to start when the resolved `baseURL` is not a local host or an
 * explicitly allowed one. Runs once, before any test, so no spec has to
 * remember the check.
 *
 * @param {FullConfig} config Resolved Playwright configuration.
 */
const globalSetup = (config: FullConfig): void => {
  const baseUrl = config.projects[0]?.use.baseURL;

  if (!baseUrl) throw new Error('No baseURL is configured for the E2E suite.');

  const { hostname } = new URL(baseUrl);
  const allowedHosts = (process.env.E2E_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  if (LOOPBACK_HOSTS.has(hostname) || allowedHosts.includes(hostname)) return;

  throw new Error(
    `Refusing to run E2E specs against ${baseUrl}: they create and delete real data. ` +
      `Add "${hostname}" to E2E_ALLOWED_HOSTS if this target is meant for it.`,
  );
};

export default globalSetup;
