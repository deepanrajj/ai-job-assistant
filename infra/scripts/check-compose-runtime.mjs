/**
 * End-to-end smoke check for the Docker Compose local runtime.
 *
 * Run it against a stack that is already up:
 *
 *   npm run dev:compose
 *   npm run compose:smoke
 *
 * This exists because of what code review found on the task 069 branch.
 * Three of the four defects there were invisible to `docker compose
 * config`, and two were invisible to any check run from loopback:
 *
 *   - ports published on 0.0.0.0 rather than loopback, so the database
 *     was reachable from the network behind a committed default password
 *   - a postgres healthcheck that probed the unix socket, which answers
 *     during init while TCP is still closed
 *   - a healthcheck addressing `localhost`, which is ::1-only inside
 *     these containers, against an IPv4-only listener
 *   - and then the fix for the first one narrowing both ports to IPv4
 *
 * Every one of those is a property of a *running* stack. Asserting them
 * here is what stops the next change from reintroducing one, since
 * "the port answers from my machine" stays true through all of them.
 */

import { execFileSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { connect } from 'node:net';

const COMPOSE_FILE = 'infra/docker/compose.yaml';
const SERVICES = [
  'smart-job-tracker-postgres',
  'smart-job-tracker-backend',
  'smart-job-tracker-frontend',
];
const PUBLISHED_PORTS = [30080, 5434];

const results = [];
const record = (ok, name, detail) => {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const compose = (...args) =>
  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

/**
 * Resolves to true only when the TCP handshake completes. A refused or
 * timed-out connection is a `false`, not a throw, because "cannot
 * connect" is the expected outcome for half of these checks.
 */
const canConnect = (host, port, timeoutMs = 3000) =>
  new Promise((resolve) => {
    const socket = connect({ host, port });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

const httpStatus = async (url) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return { status: response.status, body: await response.text() };
  } catch (error) {
    return { status: 0, body: String(error) };
  }
};

/** The first non-internal IPv4 address, or null on a host that has none. */
const lanAddress = () =>
  Object.values(networkInterfaces())
    .flat()
    .find((iface) => iface && iface.family === 'IPv4' && !iface.internal)?.address ?? null;

const main = async () => {
  let ps;
  try {
    ps = compose('ps', '--format', '{{.Service}}\t{{.Status}}\t{{.Ports}}').trim();
  } catch (error) {
    console.error('Could not run docker compose ps. Is Docker running?');
    console.error(error.stderr?.toString() ?? error.message);
    process.exit(1);
  }

  if (!ps) {
    console.error('No containers are running. Start the stack first:');
    console.error('  npm run dev:compose');
    process.exit(1);
  }

  const rows = new Map(
    ps.split('\n').map((line) => {
      const [service, status, ports = ''] = line.split('\t');
      return [service, { status, ports }];
    }),
  );

  // 1. Every service is up and reporting healthy.
  for (const service of SERVICES) {
    const row = rows.get(service);
    record(
      Boolean(row?.status.includes('(healthy)')),
      `${service} is healthy`,
      row?.status ?? 'not running',
    );
  }

  // 2. Published ports are bound to loopback and nothing else. This is
  //    the check that a curl from this machine cannot make, because a
  //    0.0.0.0 binding answers loopback too.
  const allPorts = [...rows.values()].map((row) => row.ports).join(' ');
  for (const port of PUBLISHED_PORTS) {
    const exposed = new RegExp(`0\\.0\\.0\\.0:${port}->`).test(allPorts);
    record(!exposed, `port ${port} is not published on 0.0.0.0`, exposed ? allPorts : 'loopback only');
  }

  // 3. Both loopback stacks answer. Binding 127.0.0.1 alone silently
  //    drops ::1, which some resolvers try first for `localhost`.
  for (const port of PUBLISHED_PORTS) {
    for (const host of ['127.0.0.1', '::1']) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await canConnect(host, port);
      record(ok, `port ${port} reachable on ${host}`);
    }
  }

  // 4. The same ports are refused from this machine's own LAN address.
  //    Skipped rather than failed on a host with no external interface,
  //    since a pass would be meaningless there.
  const lan = lanAddress();
  if (lan) {
    for (const port of PUBLISHED_PORTS) {
      // eslint-disable-next-line no-await-in-loop
      const reachable = await canConnect(lan, port);
      record(!reachable, `port ${port} refused from LAN address`, `${lan}:${port}`);
    }
  } else {
    console.log(`SKIP  LAN reachability - no external IPv4 interface found`);
  }

  // 5. The app and the API answer through the Nginx proxy. /api/jobs is
  //    the one that proves Flyway ran, since it reads a migrated table.
  const app = await httpStatus('http://127.0.0.1:30080/');
  record(app.status === 200, 'frontend serves the app', `HTTP ${app.status}`);

  const health = await httpStatus('http://127.0.0.1:30080/api/ai/health');
  record(
    health.status === 200 && health.body.includes('"ok":true'),
    'API health answers through the proxy',
    `HTTP ${health.status} ${health.body.slice(0, 40)}`,
  );

  const jobs = await httpStatus('http://127.0.0.1:30080/api/jobs');
  record(
    jobs.status === 200 && jobs.body.trimStart().startsWith('['),
    'jobs endpoint reads the migrated schema',
    `HTTP ${jobs.status}`,
  );

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('\nSee docs/engineering/local-runtime-environment.md for what each failure means.');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
