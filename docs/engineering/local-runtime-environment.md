# Local Runtime And Environment Traps

Failures that come from the environment rather than the code: container
DNS, Compose variable handling, and a set of machine-specific quirks
that are true on the current development machine and nowhere else.

Written after task 069, which added the Docker Compose runtime. Two of
its steps failed for reasons no amount of reading the code would have
predicted, and investigating those turned up three older traps that had
never been written down. Recording them together because the diagnosis
is the reusable part.

Read this before debugging a local runtime failure for more than a few
minutes. Read [`frontend-test-reliability.md`](./frontend-test-reliability.md)
for the equivalent note about the test suite.

## Start here: match the symptom

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Conflict. The container name "/x" is already in use by container ...` | a compose service used `container_name`, which leaves the project namespace and competes with every container on the host | remove `container_name` and accept the generated `<project>-<service>-<n>` name |
| A healthcheck fails with `wget: can't connect to remote host: Connection refused`, but the service works from the browser | the check addressed `localhost`, which resolves to `::1` inside the container, against a process listening on IPv4 only | address `127.0.0.1` instead |
| `error while interpolating ...: required variable X is missing a value` | a `${VAR:?message}` default in the compose file, and no `.env` present | use `${VAR}` or `${VAR:-default}`; see the rule below on which to pick |
| `docker compose config` warns `The "X" variable is not set. Defaulting to a blank string` | expected for `OPENAI_API_KEY`; it has no default on purpose | nothing, unless you need the AI endpoints |
| Compose ignores values you put in `.env` | the file is in the wrong directory | `.env` is read from the compose file's own directory, here `infra/docker/`, not from where you ran the command |
| `host not found in upstream "smart-job-tracker-backend"` and the frontend container exits at startup | Nginx resolves a literal upstream once, at config load, and the backend container did not exist yet | keep the `depends_on` in the compose file; this is what it is there for |
| `address already in use` on 30080 or 5434 | the other local runtime is up, or a leftover port forward is alive | Compose and Kubernetes both bind these ports and cannot run together; stop one, or see the `stop-local` skill |
| Backend exits at startup on a refused database connection | Flyway connects during startup and the database was not ready | keep the `service_healthy` condition on the postgres dependency |

The first, third and fifth rows were captured verbatim while building
task 069. The Nginx row is the predicted failure for removing the
`depends_on`; it was designed against rather than observed.

## Container networking and naming

### `container_name` leaves the project namespace

Compose names containers `<project>-<service>-<index>`. For this repo
that produces `smart-job-tracker-smart-job-tracker-postgres-1`, which is
ugly enough that pinning `container_name` is a tempting fix.

It is the wrong fix. `container_name` moves a service out of its project
namespace and into the single namespace shared by every container on the
machine. The first cold start of the compose stack failed because an
unrelated `postgres:16-alpine` container, created by hand twelve days
earlier and long since exited, already held the name.

An exited container still owns its name. Nothing about the project was
wrong; the collision came from outside it entirely.

Accept the long names. `docker compose ps` and `docker compose logs`
label their output with the short service name regardless.

### `localhost` is IPv6-only inside these containers

The frontend healthcheck reported `unhealthy` while the site served
fine through the published port. Inside the container:

```text
$ getent hosts localhost
::1               localhost  localhost
```

That is the whole mapping. There is no `127.0.0.1` entry.
`infra/docker/nginx.conf` says `listen 80`, which binds `0.0.0.0:80` and
no IPv6 address, so a request to the name is refused and the identical
request to `127.0.0.1` returns `ok`.

The backend happens to answer on both, because its listener is
dual-stack. Both healthchecks address the literal anyway, so they fail
or succeed for the same reasons rather than for different ones.

This never arises under Kubernetes, because its probes reach the
container from outside rather than from within.

### The runtime images have `wget`, not `curl`

`eclipse-temurin:21-jre-alpine` and `nginx:1.27-alpine` both ship
BusyBox, which provides `wget` and `nc` at `/usr/bin` and no `curl`.

A healthcheck written with `curl` does not report a useful error. The
container sits in `health: starting`, then flips to `unhealthy`, and the
logs say nothing about the missing binary.

Check what a base image actually contains before writing a healthcheck
against it:

```bash
docker run --rm <image> sh -c 'which wget curl nc'
```

## Compose variables and env files

### Pick the interpolation form deliberately

The three forms behave very differently, and the choice decides whether
validation works on a clean checkout.

| Form | Unset behaviour |
| --- | --- |
| `${VAR}` | warns, interpolates to an empty string, continues |
| `${VAR:-default}` | silently uses the default |
| `${VAR:?message}` | `docker compose config` fails and renders nothing |

`.env` is gitignored, so a fresh clone and every CI run have no
environment file at all. A `${VAR:?}` anywhere in the file therefore
breaks `npm run compose:config`, which is the check CI runs to prove the
compose file is valid.

That is why `POSTGRES_PASSWORD` carries a default and `OPENAI_API_KEY`
does not. The password default is the same value
`backend/src/main/resources/application.properties` already commits, so
it adds no credential the repository did not already hold, and the
database is published only on `localhost`. A real credential gets no
default and no `:?`; it interpolates blank, warns, and only the feature
that needs it fails.

### `.env` is read from the compose file's directory

Not from the working directory, and not from the repository root. The
npm scripts invoke Compose as `-f infra/docker/compose.yaml` from the
root, and the file that gets loaded is `infra/docker/.env`.

Copy the template to the right place:

```bash
cp infra/docker/.env.example infra/docker/.env
```

### Gitignore patterns without a slash match at any depth

`infra/docker/.env` is ignored by the existing root-level `.env` rule,
and `infra/docker/.env.example` survives through the existing
`!.env.example` negation. Neither needed a new rule.

This is worth knowing before adding a redundant pattern, and before
assuming a nested `.env` is safe because the ignore rule "looks
top-level".

Confirm rather than assume:

```bash
git check-ignore -v <path>
git status --porcelain <path>
```

### What `docker compose config` does and does not catch

It parses the file, interpolates every variable, and resolves build
contexts, so it catches a renamed Dockerfile, a bad default, and a
malformed service.

It starts nothing. Both failures that actually cost time on task 069, a
name collision and a wrong loopback address, are invisible to it. Only a
cold `up` finds those.

## This machine only

**Nothing in this section applies to a clean checkout on another
machine.** It describes the current Windows development machine. A
developer on Linux or macOS should skip it entirely, and no fix here
belongs in a Dockerfile, a manifest, or CI.

### `JAVA_TOOL_OPTIONS` is already set globally: do not prefix it

Java on this machine fails to open a selector when the socket file lives
in the user temp directory, most likely antivirus interference. The
workaround directs it elsewhere, and it is **already set globally**:

```text
JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\tmp
```

Older guidance said to prefix every Gradle command with that value.
Under the Bash tool that advice is actively harmful, because an unquoted
prefix loses the backslash and overwrites a correct global value with a
broken path:

```text
JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\tmp   ->  C:tmp
JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\\tmp  ->  C:tmp
JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\tmp' ->  C:\tmp
```

So: check before you set it.

```bash
echo $JAVA_TOOL_OPTIONS
```

If it is already correct, run Gradle with no prefix at all. If a prefix
is ever genuinely needed, single-quote the value.

Gradle also needs `dangerouslyDisableSandbox`, because the sandbox
blocks the daemon's loopback connection.

### JVM crash logs in the repository root are a memory signal

The root holds several `hs_err_pid*.log` and `replay_pid*.log` files.
They are gitignored, so they never reach a commit, but they are worth
reading rather than ignoring.

All of them are out-of-memory crashes, and all come from the VS Code
Java language server rather than from Gradle. The machine has about
15 GB of RAM with roughly 2 GB free while the stack is running.

This is the same underlying cause the test-reliability note describes,
seen from a different direction. When several unrelated things start
failing at once, suspect memory pressure before suspecting the change
you just made. A local cluster, a Docker daemon, a compose stack and an
IDE language server do not fit comfortably together on this machine.

### `k8s:create-secret` cannot work as written on Windows

The script reads `$OPENAI_API_KEY` with POSIX syntax. npm runs scripts
through `cmd.exe` here, which does not expand `$VAR`, so the secret is
created with the literal string instead of the value.

Use the `kubectl create secret` command in
[`../setup.md`](../setup.md) directly. The `start-local` skill says the
same thing.

## Rules

- **Match the symptom before theorising.** The table at the top exists
  because every trap here produced a distinctive error string, and each
  one pointed somewhere other than where the real cause lay.
- **Validate and start.** `docker compose config` and a cold
  `docker compose up` catch disjoint classes of problem. Passing the
  first proves very little about the second.
- **Check what an image contains before depending on it.** One
  `docker run --rm <image> sh -c '...'` is faster than reading a
  healthcheck failure that does not name the missing binary.
- **Prefer the container's own project namespace.** Anything that opts
  a service out of it, `container_name` most of all, trades a cosmetic
  gain for a collision with the rest of the machine.
- **Never let a machine-specific fix reach a shared file.** Everything
  in the section above belongs in this note, in a skill, or in an
  environment variable. None of it belongs in a Dockerfile, a
  manifest, or a workflow.
- **Verify an environment variable instead of setting it again.**
  `echo $VAR` costs nothing, and re-setting one is how a correct value
  becomes a broken one.
