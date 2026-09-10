# Task 069 - Add Docker Compose For Full Local Stack Plan

Status: Completed

## Purpose

Add a second way to run the whole stack locally: one `docker compose`
command that brings up PostgreSQL, the Spring Boot backend, and the
Nginx-served frontend build.

The Kubernetes runtime stays the default. Compose exists for the cases
Kubernetes serves badly: a reviewer who wants to see the app without
enabling Docker Desktop Kubernetes, and the demo-data and screenshot
tasks that follow (070, 071), which want a database that survives a
restart.

This task adds no application code. It adds one compose file, one
environment template, npm scripts, one CI validation step, and the
documentation to go with them.

## Authoritative References

- `AGENTS.md`
- `docs/context.md`
- `docs/setup.md`
- `docs/infrastructure.md`
- `docs/engineering/pr-review.md`
- `tasks/roadmap/069-add-docker-compose-for-full-local-stack.md`
- `docs/business/077-make-backend-scripts-cross-platform-plan.md`
- `docs/business/postgresql-docker-service-plan.md`

## Current State

Two runtimes exist today.

`npm run dev` builds `smart-job-tracker-backend:local` and
`smart-job-tracker-frontend:local`, loads them into the Docker Desktop
Kubernetes node, applies `infra/k8s/local`, and forwards the frontend to
`localhost:30080` and PostgreSQL to `localhost:5434`.

`npm run dev:local` runs Vite on 5173 and Gradle `bootRun` on 4000 as
host processes, with no database of its own.

The pieces a compose file has to reuse:

- `infra/docker/backend.Dockerfile` and
  `infra/docker/frontend.Dockerfile`, both built with the repository
  root as context.
- `infra/docker/nginx.conf`, which hard-codes
  `proxy_pass http://smart-job-tracker-backend:4000;` and is baked into
  the frontend image.
- `backend/src/main/resources/application.properties`, which reads
  `DB_URL`, `DB_USER`, `DB_PASSWORD`, `OPENAI_API_KEY`,
  `OPENAI_BASE_URL`, and `OPENAI_MODEL`, and already defaults the
  datasource to `jdbc:postgresql://localhost:5434/smartjobtracker` with
  user and password `smartjobtracker`.
- `infra/k8s/local/backend-configmap.yaml` and
  `postgres-configmap.yaml`, which hold the non-secret values.
- The secret keys `OPENAI_API_KEY` and `POSTGRES_PASSWORD`.

`/api/ai/health` in `AiController` is the only health endpoint. Both
Kubernetes probes use it.

The toolchain on this machine is Docker 29.5.2 and Docker Compose
v5.1.4.

## Decisions

### The compose file lives at `infra/docker/compose.yaml`

`AGENTS.md` section 1 assigns Docker to `infra/`, and both Dockerfiles
and the Nginx config are already there. A compose file that builds from
those Dockerfiles belongs beside them.

Rejected: a root `docker-compose.yml`. It is the conventional location,
it makes bare `docker compose up` work, and it would put `.env` at the
root. It also spreads the Docker configuration across two directories
for no reason other than convention.

The cost is that every invocation needs `-f infra/docker/compose.yaml`,
which is why the npm scripts wrap it.

The file is named `compose.yaml`, the current Compose Specification
default. `docker-compose.yml` is the legacy name. The task title uses
"docker-compose" as the name of the tool, not as a filename.

### The project name is pinned to `smart-job-tracker`

Compose derives the project name from the compose file's directory when
it is not told otherwise, so `-f infra/docker/compose.yaml` would create
a project called `docker`, with containers named `docker-*` and a
network called `docker_default`. That collides with any other project on
the machine that happens to sit in a `docker/` directory.

A top-level `name: smart-job-tracker` fixes it. Verified with a throwaway
compose file in a nested directory: `docker compose config` reported
`name: smart-job-tracker`-equivalent output and
`networks.default.name: <name>_default`. The probe was deleted.

### Service names mirror the Kubernetes Service names

The three services are `smart-job-tracker-frontend`,
`smart-job-tracker-backend`, and `smart-job-tracker-postgres`.

This is not cosmetic. Compose publishes service names as DNS names on
the project network, and `infra/docker/nginx.conf` already resolves its
upstream by the name `smart-job-tracker-backend`. Matching the names
lets one Nginx config, baked into one image, serve both runtimes.

Rejected: rendering `nginx.conf` from a template with `envsubst` at
container start. It adds an entrypoint shim to the frontend image, gives
the upstream address two sources of truth, and has to keep working under
Kubernetes as well.

### The frontend declares `depends_on` the backend

Nginx resolves a literal upstream hostname once, when it loads its
configuration, and refuses to start if the name does not resolve. Under
Kubernetes this never bites, because the Service object exists
independently of the backend pod, so the name resolves before any
container is running.

Compose has no equivalent object. The name resolves only once the
backend container exists. Without `depends_on`, starting the stack from
cold is a race, and the failure is the frontend container exiting during
startup with `host not found in upstream`.

`service_started` is enough here. The backend only has to exist for DNS,
not to be serving requests.

### The backend depends on PostgreSQL being healthy, not merely started

Flyway runs on backend startup and connects immediately. A backend that
starts alongside an initialising PostgreSQL fails with a connection
refusal and exits.

So `smart-job-tracker-postgres` gets a `pg_isready` healthcheck and the
backend declares `condition: service_healthy` on it.

### Healthchecks use what the base images actually ship

The backend runtime image is `eclipse-temurin:21-jre-alpine`. Verified
by running the image: it provides BusyBox `wget` and `nc` at
`/usr/bin`, and no `curl`. So the backend healthcheck is a `wget` call
against `http://localhost:4000/api/ai/health`, matching the Kubernetes
probe path.

Writing `curl` here would have produced a container stuck in
`health: starting` and then `unhealthy`, with an exit status the logs do
not explain.

### Images are built under the tags Kubernetes already uses

Each buildable service sets both `build` and
`image: smart-job-tracker-<part>:local`, so compose builds produce
exactly the tags `npm run docker:build` produces and
`npm run k8s:load-images` looks for.

Rejected: a separate `:compose` tag per service. Separate tags mean the
two runtimes can be running different code from the same checkout, and
that a compose build does nothing for the cluster path.

### Published host ports match the documented Kubernetes forwards

The frontend publishes `30080:80` and PostgreSQL publishes `5434:5432`,
the ports `docs/setup.md` and `docs/infrastructure.md` already document.

The consequence the task file does not mention: the two runtimes can no
longer run at the same time. Whichever starts second fails to bind.

That is accepted deliberately. They are two ways to run the same stack,
not two halves of one. A developer with both up has two PostgreSQL
instances holding different data and no clear signal about which one the
browser is talking to. Failing to bind a port is a much better outcome
than that, and the documentation states the either/or explicitly.

Rejected: a distinct port block such as 30081 and 5435. It allows both
at once and makes every URL in the setup documentation conditional on
which runtime is running.

Publishing 5434 has a useful side effect worth documenting:
`docker compose up smart-job-tracker-postgres` gives `npm run dev:local`
the database it currently lacks, because the backend's default `DB_URL`
already points at `localhost:5434`.

### Both published ports name `127.0.0.1` explicitly

Added after code review of this branch, which is also when the mistake
was found.

The plan above said the compose ports "match the documented Kubernetes
forwards" and concluded the two runtimes were equivalent. They were not.
`kubectl port-forward` binds loopback by default; a compose mapping
written as `5434:5432` binds `0.0.0.0`. Same port number, completely
different reach.

That mattered because the same plan committed a default database
password on the grounds that the database was "published only on
localhost". It was not, and the verification never noticed, because it
only checked that the port answered from this machine. It answers either
way.

Both mappings now carry an explicit host address. Confirmed after the
change: `docker compose ps` reports `127.0.0.1:5434->5432/tcp`, and the
machine's own LAN address refuses both 5434 and 30080 while loopback
still serves.

Rejected: keeping `0.0.0.0` and removing the password default instead.
That would make `docker compose config` fail on a clean checkout, which
is the thing the interpolation decision above exists to prevent, and it
would still publish the app itself to the network for no reason.

### The postgres healthcheck probes TCP, not the unix socket

Also from the review, and unlike everything else in this plan it had not
failed yet.

`pg_isready` with no `-h` checks `/var/run/postgresql`, a socket
directory. The `postgres` entrypoint runs its init-phase server with
`listen_addresses=''` — "socket-only", in the image's own comment. So on
a first start the socket can answer while TCP is still closed, the
healthcheck reports healthy early, `condition: service_healthy` releases
the backend, and Flyway meets a refused connection.

The stack came up correctly every time during implementation, which is
luck rather than correctness: initdb finished before the first check
fired. A slower disk or a busier machine widens that window.

`-h 127.0.0.1` forces the TCP path. This is worse under Compose than
under Kubernetes, where a crash-looping pod retries and the restart is
the recovery — `start-local` documents that as expected behaviour. The
compose backend has no restart policy, by the decision below, so an
early start would not be retried at all.

### The backend port is not published

Rejected: publishing `4000:4000`. The Kubernetes runtime reaches the
backend only through the Nginx proxy, and everything that matters is
reachable that way: the API under `http://localhost:30080/api`, Swagger
UI at `http://localhost:30080/api/swagger-ui.html`. A published backend
port would be a second, compose-only entry point, and the first thing to
diverge between the two runtimes.

### PostgreSQL data goes in a named volume

This diverges from the Kubernetes runtime, which mounts an `emptyDir`
and loses the database whenever the pod is recreated.

The divergence is the point. Named volumes are the Compose idiom, and
task 070 (seed demo data) and task 071 (screenshots) both want data that
outlives a restart. `npm run compose:reset`, which is `down -v`, is the
documented way back to a clean database.

Rejected: a `tmpfs` mount for exact parity with `emptyDir`. Parity for
its own sake, at the cost of making the compose path worse for the two
tasks that come next.

### `POSTGRES_PASSWORD` has a committed default, `OPENAI_API_KEY` does not

`${POSTGRES_PASSWORD:-smartjobtracker}` is the same value
`application.properties` already commits as the `DB_PASSWORD` default,
so it introduces no credential that is not already in the repository. It
is a local database that is only reachable from `localhost`.

`${OPENAI_API_KEY}` is a real credential and gets no default. Compose
interpolates it to an empty string and prints a warning. Everything
except the `/api/ai/*` endpoints works without it, which matches how the
backend behaves today.

Rejected: `${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}`. Verified that
the `:?` form makes `docker compose config` fail with
`required variable ... is missing a value` and refuse to render. Since
`.env` is gitignored, that form would make this task's own test,
"compose configuration validates", fail on a fresh clone and in CI.

`DB_URL` is assembled inside the compose file as
`jdbc:postgresql://smart-job-tracker-postgres:5432/${POSTGRES_DB:-smartjobtracker}`
so the database name has one source rather than two.

### Environment values come from `infra/docker/.env`

Verified that Compose loads `.env` from the compose file's own directory
even when invoked as `-f nested/compose.yaml` from a different working
directory. So `infra/docker/.env` is picked up by every npm script
without a `--env-file` flag.

No gitignore change is needed. The existing `.env` and `.env.*` patterns
have no slash, so they match at any depth, and `!.env.example` re-includes
the template. `infra/docker/.env.example` is committed with placeholders
and every variable documented; `infra/docker/.env` is ignored.

Rejected: passing values inline in the npm scripts. That puts the OpenAI
key in shell history and in the terminal scrollback.

### CI validates the compose file

The task lists "compose configuration validates" as a test, and compose
has no unit-test harness. `docker compose config -q` is the closest
thing: it parses the file, interpolates every variable, and resolves the
build contexts.

It goes into the existing Docker Build workflow, which already has
Docker available and already builds these images. One step, no new
workflow.

Rejected: leaving validation to manual runs. An unvalidated compose file
rots quietly, and this one references Dockerfile paths, an Nginx
upstream, and a service name in a file it does not contain.

### Containers keep their generated names

Compose names a container `<project>-<service>-<index>`, which here
produces `smart-job-tracker-smart-job-tracker-postgres-1`. The doubled
prefix is ugly, so the first implementation pinned each service with
`container_name`.

That was wrong, and the stack refused to start on the first cold run:

```text
Conflict. The container name "/smart-job-tracker-postgres" is already
in use by container 2c6669531659
```

The conflicting container was an unrelated `postgres:16-alpine` left
over on this machine from twelve days earlier. `container_name` opts a
service out of project namespacing and moves it into a single global
namespace shared with every container on the host, which is the whole
reason the generated names look the way they do.

So `container_name` is not used. The names stay long, `docker compose
ps` and `logs` label output by the short service name anyway, and the
stack cannot be blocked by an unrelated container.

Rejected alongside it: shortening the service names to `postgres`,
`backend`, and `frontend` and restoring the Nginx upstream with a
network alias. It gives short container names, but it hides the reason
the upstream resolves inside an `aliases` list that is easy to delete
without understanding.

### Healthchecks address the IPv4 literal, not `localhost`

Both healthchecks use `127.0.0.1`. This was not the first attempt, and
the frontend sat `unhealthy` until it was fixed.

Inside these containers `/etc/hosts` maps `localhost` to `::1` and
nothing else. Verified by running `getent hosts localhost` in the
running frontend container. `infra/docker/nginx.conf` says `listen 80`,
which binds `0.0.0.0:80` and no IPv6 address, so a request to the name
is refused while the same request to `127.0.0.1` returns `ok`. Both were
run inside the container to confirm.

The backend happens to answer on both, because its listener is
dual-stack. It still uses the literal, so the two healthchecks fail or
succeed for the same reasons.

Rejected: adding `listen [::]:80;` to `nginx.conf`. It would work, but
this task is not supposed to touch a file the Kubernetes runtime also
depends on, and the probe in `frontend-deployment.yaml` reaches the
container from outside, where the question never arises.

### The backlog's recommended next task stays at task 010

`docs/backlog/phase-8-portfolio-polish.md` states that task 069 has no
dependency on unfinished feature work and is worth doing early.
Completing it is therefore not evidence that the feature sequence has
advanced, so the recommended-next-task pointer stays where it is.

The phase 8 checkbox for 069 still gets ticked.

## Proposed Change

### `infra/docker/compose.yaml`

Top-level `name: smart-job-tracker`, one named volume, three services.

| Service | Image | Build | Ports | Depends on |
| --- | --- | --- | --- | --- |
| `smart-job-tracker-postgres` | `postgres:16` | none | `5434:5432` | none |
| `smart-job-tracker-backend` | `smart-job-tracker-backend:local` | root context, `infra/docker/backend.Dockerfile` | none | postgres, healthy |
| `smart-job-tracker-frontend` | `smart-job-tracker-frontend:local` | root context, `infra/docker/frontend.Dockerfile` | `30080:80` | backend, started |

Build contexts are `../..`, which Compose resolves relative to the
compose file's directory. Verified: `docker compose config` expanded
`context: ../..` to the intended absolute path.

Environment, all interpolated from `.env` with the defaults shown:

```text
smart-job-tracker-postgres
  POSTGRES_DB        ${POSTGRES_DB:-smartjobtracker}
  POSTGRES_USER      ${POSTGRES_USER:-smartjobtracker}
  POSTGRES_PASSWORD  ${POSTGRES_PASSWORD:-smartjobtracker}

smart-job-tracker-backend
  OPENAI_API_KEY   ${OPENAI_API_KEY}
  OPENAI_BASE_URL  ${OPENAI_BASE_URL:-https://api.openai.com}
  OPENAI_MODEL     ${OPENAI_MODEL:-gpt-5.4}
  DB_URL           jdbc:postgresql://smart-job-tracker-postgres:5432/${POSTGRES_DB:-smartjobtracker}
  DB_USER          ${POSTGRES_USER:-smartjobtracker}
  DB_PASSWORD      ${POSTGRES_PASSWORD:-smartjobtracker}
```

Healthchecks:

```text
postgres   pg_isready -U <POSTGRES_USER> -d <POSTGRES_DB>
backend    wget --quiet --output-document=- http://127.0.0.1:4000/api/ai/health
frontend   wget --quiet --output-document=- http://127.0.0.1/healthz
```

The frontend gets a healthcheck too, mirroring the `/healthz` probe in
`frontend-deployment.yaml`. See the IPv4 decision above for why these
address the literal rather than `localhost`.

The backend healthcheck needs a `start_period` long enough for Spring
plus Flyway, not just an interval. Sixty seconds, with the interval and
retries chosen so an unhealthy backend is reported rather than retried
indefinitely.

No `restart` policies. `depends_on` with the health condition removes
the reason for them, and a restart loop hides a startup failure behind
repeated log output.

### `infra/docker/.env.example`

Every variable above, with placeholder values and a comment per
variable saying what it does and what happens when it is left unset.
`OPENAI_API_KEY` is blank with a note that only the AI endpoints need
it. No real values.

### npm scripts

| Script | Command |
| --- | --- |
| `dev:compose` | `docker compose -f infra/docker/compose.yaml up --build -d` |
| `compose:down` | `docker compose -f infra/docker/compose.yaml down` |
| `compose:reset` | `docker compose -f infra/docker/compose.yaml down -v` |
| `compose:logs` | `docker compose -f infra/docker/compose.yaml logs -f` |
| `compose:config` | `docker compose -f infra/docker/compose.yaml config -q` |

`dev:compose` sits next to `dev:cluster` and `dev:local` as the third
named runtime. It runs detached, unlike `dev:cluster`, because compose
already supervises the containers and `compose:logs` covers the
attached case.

`npm run dev` continues to mean `dev:cluster`. Kubernetes stays the
default, as the task requires.

### `.github/workflows/docker-build.yml`

One step after the image build:

```yaml
- name: Validate compose configuration
  run: npm run compose:config
```

### Documentation

- `docs/setup.md`: a "Run With Docker Compose" section between the
  Kubernetes and non-Kubernetes sections, with the env file step, the
  variable table, the URLs, and the statement that compose and
  Kubernetes cannot run at once because they bind the same host ports.
- `docs/infrastructure.md`: a Compose section covering service names,
  the shared `:local` image tags, the named volume against the cluster's
  `emptyDir`, and the ports table.
- `infra/README.md`: the compose commands, and a line on when to use
  compose rather than the cluster.
- `docs/context.md` section 7: name `npm run dev:compose` as a third
  runtime alongside `npm run dev` and `npm run dev:local`.
- `docs/business/README.md`: link this plan.

## Tests

There is no application code here, so the checks are the ones the task
file lists.

1. `npm run compose:config` exits zero on a checkout with no `.env`
   present. This is the regression guard for the interpolation decision
   above, and it is what CI runs.
2. `npm run dev:compose` from cold, with no `.env` and no existing
   volume, reaches three running containers with the backend reported
   healthy.
3. `http://localhost:30080` serves the app and
   `http://localhost:30080/api/ai/health` returns `{"ok":true}` through
   the Nginx proxy, proving the upstream name resolved.
4. `GET /api/jobs` through the proxy returns a list, proving Flyway ran
   against the compose database.
5. `npm run compose:down` then `npm run dev:compose` again: data written
   before the down is still there, proving the named volume.
   `npm run compose:reset` clears it.
6. `npm run k8s:apply` is unaffected: `kubectl apply -k infra/k8s/local`
   still renders and applies, and no file under `infra/k8s/` changed.

## Implementation Order

Ordered so each step fails in a way that names its own cause.

1. Add this plan and link it from `docs/business/README.md`.
2. Add `infra/docker/.env.example`.
3. Add `infra/docker/compose.yaml` with the postgres service only, and
   run `docker compose config`. Failure here is a syntax or
   interpolation error, isolated from any build.
4. Bring postgres up alone and confirm the healthcheck reports healthy.
   Failure here is `pg_isready` arguments, nothing else.
5. Add the backend service. Bring it up. The failure to expect if the
   health condition is missing or wrong is the backend exiting on a
   refused connection to PostgreSQL, visible in its logs as a Flyway or
   HikariCP failure.
6. Add the frontend service. The failure to expect if `depends_on` is
   missing is the frontend container exiting with
   `host not found in upstream "smart-job-tracker-backend"`.
7. Add the npm scripts.
8. Run the full cold-start sequence from step 2 of Tests.
9. Add the CI validation step.
10. Update `docs/setup.md`, `docs/infrastructure.md`, `infra/README.md`,
    and `docs/context.md`.
11. Confirm the Kubernetes path still applies cleanly.
12. Update the task and backlog checkboxes and mark this plan
    `Completed` with a verified-state section.

## Verification Plan

```bash
npm run compose:config
```

```bash
npm run dev:compose
```

Then the URL checks from Tests, `npm run compose:down`, and a
`kubectl apply -k infra/k8s/local --dry-run=client` to confirm the
cluster manifests are untouched.

`npm run verify` is not required: this change adds no frontend or
backend source. It will be run once anyway to confirm nothing in the
repository moved underneath it. Gradle on this machine needs
`JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\tmp`.

Docker Compose v5.1.4 and Docker 29.5.2 are what the commands above were
checked against.

## Scope Boundaries

- No change to `infra/docker/nginx.conf`, either Dockerfile, or any file
  under `infra/k8s/`.
- No change to `npm run dev`, which keeps meaning `dev:cluster`.
- No application code, migration, entity, endpoint, or test.
- No seed or demo data. That is task 070.
- No production or cloud compose file, no registry, no image publishing.
- No secrets committed, and no `.env` committed.
- No new dependency, in the root workspace or either app.
- No replacement of the Kubernetes runtime.
- No refactor of the existing npm scripts beyond adding the new ones.

## Completion Rules

After the verification above passes:

- Tick the acceptance criteria in
  `tasks/roadmap/069-add-docker-compose-for-full-local-stack.md` and set
  its status.
- Tick task 069 in `docs/backlog/phase-8-portfolio-polish.md`.
- Leave the recommended next task in `docs/backlog/README.md` at task
  010.
- Mark this plan `Completed` and add a verified-state section recording
  what was built and what the verification run reported.

## Acceptance Criteria

- [x] `docker compose config` succeeds on a checkout with no `.env`.
- [x] `npm run dev:compose` brings up frontend, backend, and PostgreSQL,
      with the backend healthy.
- [x] The app and `/api/ai/health` are reachable at `localhost:30080`.
- [x] Compose service names and host ports match the Kubernetes runtime,
      and `nginx.conf` is unchanged.
- [x] The Kubernetes runtime still applies and runs.
- [x] No secret value is committed; `.env.example` holds placeholders
      only.
- [x] Setup, infrastructure, and context documentation describe the
      compose runtime and the port conflict between the two runtimes.

## Verified State

Implemented and verified on the task 069 branch.

Added `infra/docker/compose.yaml` (three services, one named volume),
`infra/docker/.env.example`, five npm scripts, one CI step, and the
documentation updates listed above. No application code changed, and
nothing under `infra/k8s/` changed.

Two things in the plan were wrong and were corrected against a running
stack rather than reasoned about. Both now have their own decision entry
above.

- `container_name` broke the first cold start. An unrelated
  `postgres:16-alpine` container, left on this machine twelve days
  earlier, already held the name `smart-job-tracker-postgres`, and
  `container_name` had opted the service out of project namespacing.
  Removed.
- The frontend healthcheck against `http://localhost/healthz` reported
  `unhealthy` with `connection refused`. Inside the container
  `/etc/hosts` maps `localhost` to `::1` only, while `listen 80` in
  `nginx.conf` binds IPv4. Both healthchecks now address `127.0.0.1`.

What the verification run reported:

- `npm run compose:config` exits 0 with no `.env` present, warning only
  that `OPENAI_API_KEY` is unset. This is what the new CI step runs.
- Cold start from no volume: PostgreSQL healthy in about 6 seconds, then
  the backend started, then the frontend. All three reported `healthy`.
  The ordering in the Compose output shows `Waiting` then `Healthy` on
  PostgreSQL before the backend starts, which is the `service_healthy`
  condition doing its job.
- Through the proxy on port 30080: `/` returned 200, `/api/ai/health`
  returned `{"ok":true}`, `/api/jobs` returned `[]`, and
  `/api/v3/api-docs` returned 200. The `/api/jobs` result is the
  evidence that Flyway ran against the compose database.
- Volume persistence: a job created through the API survived
  `npm run compose:down` followed by `npm run dev:compose`, and was gone
  after `npm run compose:reset`.
- Kubernetes untouched: `git status` reports no change under
  `infra/k8s/`, `kubectl kustomize infra/k8s/local` still renders, and
  both `:local` image tags exist after the compose build.
- `npm run verify` exits 0. It was run for completeness rather than
  necessity: no frontend or backend source changed, so every Gradle task
  reported `UP-TO-DATE` and no test actually re-executed.

Code review of this branch then found two more, neither of which had
produced a symptom: the ports were published on every interface, and the
postgres healthcheck could pass before the database accepted TCP
connections. Both now have decision entries above. After fixing them, a
cold start from an empty volume brought all three services to `healthy`,
the app and API still answered on loopback, and the machine's LAN
address refused both published ports.

The lesson worth keeping: three of the four defects on this branch were
invisible to `docker compose config` and to any check run from the host
itself. Two needed a cold `up`, and one needed a probe from a different
network address.

The generalisable half of both corrections, plus the older environment
traps found while investigating them, is written up separately in
[`../engineering/local-runtime-environment.md`](../engineering/local-runtime-environment.md).
This plan records why task 069 is shaped the way it is; that note is
where an agent hitting one of these errors in a new context should
start.

Note for future readers: `docker compose config` is a real check, not a
formality. It parses, interpolates every variable, and resolves the
build contexts, so it catches a renamed Dockerfile or a broken default.
It does not start anything, so it cannot catch what the two corrections
above were: a name collision and a wrong loopback address. Those only
appear on a cold `up`.
