# Local Runtime And Environment Traps

Failures that come from the environment rather than the code: container
DNS, Compose variable handling, and a set of machine-specific quirks
that are true on the current development machine and nowhere else.

Written after task 069, which added the Docker Compose runtime. Two of
its steps failed for reasons no amount of reading the code would have
predicted, code review of that task found two more that had not failed
yet, and investigating all four turned up older traps that had never
been written down. Recording them together because the diagnosis is the
reusable part.

The two the review found are worth singling out, because neither
produced a symptom at the time: a port published on every interface
rather than loopback, and a database healthcheck that can pass before
the database accepts connections. Both are below.

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
| Backend exits at startup on a refused database connection | Flyway connects during startup and the database was not ready | keep the `service_healthy` condition on the postgres dependency, and make sure the postgres healthcheck probes TCP rather than the unix socket |
| A published port answers locally but is also reachable from the network | `ports: "5434:5432"` binds `0.0.0.0`, unlike `kubectl port-forward`, which binds loopback | give the mapping an explicit host address, `127.0.0.1:5434:5432` |
| The pre-commit hook fails Prettier on frontend files your commit did not touch | git wrote CRLF into the working tree, and the hook checks the whole frontend rather than the staged files | fixed by `* text=auto eol=lf` in the root `.gitattributes`; on a clone from before that, refresh the working tree once with `git rm --cached -r . && git reset --hard`, having committed or stashed first |

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

### A ready database socket does not mean a ready database port

`pg_isready` with no `-h` probes `/var/run/postgresql`, a unix socket
directory, not TCP. The official `postgres` entrypoint starts its
init-phase server with `listen_addresses=''`, described in the image's
own source as "start socket-only postgresql server ... does not listen
on external TCP/IP".

So during first-time initialisation the socket answers while the TCP
port is closed. A healthcheck built on the socket can report `healthy`,
release everything waiting on `condition: service_healthy`, and hand the
dependent service a refused connection.

Force the TCP path:

```yaml
test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U <user> -d <db>"]
```

This is worse under Compose than under Kubernetes. A crash-looping pod
retries, and `start-local` documents the resulting one or two backend
restarts as expected. The compose backend has no restart policy, so an
early start is not retried; it just stays down.

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
it adds no credential the repository did not already hold, and the port
is bound to loopback. See the next section, which is the reason that
second half is true rather than assumed. A real credential gets no
default and no `:?`; it interpolates blank, warns, and only the feature
that needs it fails.

### Publishing a port is not the same as forwarding one

`ports: - "5434:5432"` binds `0.0.0.0`. The container is then reachable
from every interface on the machine, including whatever network it
happens to be attached to.

`kubectl port-forward` binds `127.0.0.1` by default. So the two local
runtimes here can name the same port number and still differ in who can
reach it, which is easy to miss when the check is "does the port answer
from this machine". It answers either way.

This mattered because the compose file ships a default database
password. Published on `0.0.0.0`, that combination puts a writable
database on the local network behind a password anyone can read in the
repository.

The goal is **loopback-only, not IPv4-only**, and those are not the same
thing. Naming `127.0.0.1` alone silently drops the IPv6 loopback, and
some resolvers return `::1` first for `localhost`, so each port names
both addresses:

```yaml
- "127.0.0.1:5434:5432"
- "[::1]:5434:5432"
```

The IPv4-only form is easy to ship and hard to notice, because the
common clients paper over it: curl retries on IPv4 after `::1` is
refused, and the JVM resolves `127.0.0.1` first, so JDBC against
`localhost:5434` still connects. A client that prefers IPv6 without
falling back does not.

Do not verify this by hand. `npm run compose:smoke` asserts all of it:

```text
PASS  port 5434 is bound to loopback only - bound on 127.0.0.1, ::1
PASS  port 5434 reachable on 127.0.0.1
PASS  port 5434 reachable on ::1
PASS  port 5434 refused from 192.168.178.20
```

The binding assertion is an allowlist: every bound address has to be
`127.0.0.1` or `::1`. Listing bad addresses instead would pass anything
it had not been taught, and `[::]` is exactly that - an IPv6 wildcard
that reaches every interface without the string `0.0.0.0` appearing.

One more consequence of naming `[::1]`: the stack now needs a working
IPv6 loopback to start at all. On a host with IPv6 disabled, Docker
cannot bind it and `up` fails outright. `docs/setup.md` says so, and
says what to drop if you must run without it.

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

`npm run compose:smoke` is the check for everything `config` cannot see.
Run it against a stack that is already up, after any change to the
compose file, the Dockerfiles, or `nginx.conf`:

```bash
npm run dev:compose
npm run compose:smoke
```

It asserts that every service is healthy, that both published ports are
bound to loopback on both IP stacks, that the same ports are refused
from the machine's own LAN address, and that the app, the health
endpoint, and a database-backed endpoint all answer through the proxy.

CI runs it too. The Docker Build workflow brings the stack up with
`--wait` and then runs the check, so this is no longer something that
only happens when somebody remembers.

Be clear about its limits. It was confirmed to fail when the `0.0.0.0`
binding is reintroduced, and its binding assertions are covered by a
table of known-good and known-bad `docker compose ps` strings. But it
does **not** catch the socket-versus-TCP healthcheck problem, because
that one is a startup race that simply did not fire on a machine where
initdb is fast. No assertion against a running stack can catch a race
that did not happen. Read the healthcheck before trusting it.

The LAN assertions are corroboration, not proof. A host firewall
produces the same refusal a correct binding does, so the allowlist check
is the one that decides.

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

### A commit fails Prettier on frontend files it did not touch

**Fixed. The root `.gitattributes` now pins the working-tree ending.**
This entry is kept because the mechanism is worth understanding and
because the reasoning that delayed the fix was wrong in a way that is
easy to repeat.

Symptom, before the fix: a backend-only or docs-only commit is rejected
by the pre-commit hook with

```text
[warn] src/services/index.ts
[warn] Code style issues found in 4 files.
```

naming frontend files that are not in the commit and that nobody edited.

Three things combined.

**Git wrote CRLF into the working tree here.** `.gitattributes` set
`* text=auto`, which normalizes to LF *in the index* and says nothing
about the working tree. That is left to `core.autocrlf`, which is `true`
on this machine, the git-for-Windows default. Any git operation that
materialized a file therefore wrote CRLF. Demonstrated directly:
`git checkout -- frontend/` turned an LF file into a CRLF one.

Only the files git actually rewrote were affected, which is why the set
looked arbitrary. After a branch switch it was exactly the files that
differ between the two branches.

**The hook checks more than the commit.** `frontend:format:check` runs
`prettier . --check` over the whole frontend, while `lint-staged` covers
the staged files. Prettier defaults to `endOfLine: "lf"` and
`frontend/.prettierrc.json` does not override it, so one stray CRLF file
anywhere failed the commit.

**Nothing else objected.** CI checks out on Linux, where `core.autocrlf`
is `false`, so the pipeline never saw it. That is why this survived as
per-developer friction for so long.

#### The fix

The root `.gitattributes` now reads:

```text
* text=auto eol=lf
```

`eol=lf` pins the *working tree* as well as the index, so checkout stops
converting regardless of what `core.autocrlf` says on any machine.

#### Why the old reasoning was wrong

This entry previously argued the fix was "**not** the one-liner it looks
like", because `eol=lf` would force LF onto the tracked
`backend/gradlew.bat`, and batch files with LF endings misbehave under
`cmd.exe`. That risk is real. `infra/scripts/run-gradle.mjs` invokes
`.\gradlew.bat` through `cmd.exe` on Windows, so a corrupted wrapper
would break every backend command.

The premise was the wrong part. `backend/.gitattributes`, shipped by the
Gradle wrapper, already carries the needed exception:

```text
/gradlew text eol=lf
*.bat text eol=crlf
*.jar binary
```

A deeper attributes file wins over a parent for the paths it matches, so
`*.bat text eol=crlf` overrides the root rule. Verified rather than
assumed, before applying anything: with `eol=lf` set at the root,
`git check-attr -a backend/gradlew.bat` still reported `eol: crlf`,
while `README.md` and the frontend sources reported `eol: lf`.

The lesson is narrower than "check your assumptions". The blocking
condition named in this entry was a file that needed writing. It already
existed, a directory away, because a tool had generated it. Look for the
exception before concluding it has to be built.

#### Applying it to an existing clone

The index was already uniformly LF, so the change only affects what
checkout writes. Files already sitting in the working tree keep their
endings until git rewrites them once:

```bash
git rm --cached -r . && git reset --hard
```

`reset --hard` discards uncommitted work, so commit or stash first.

#### The old workaround

Kept for anyone on a clone from before the fix. From the repository
root, `npm run frontend:format`, with two traps:

- It is **not** a no-op in git's eyes. Afterwards `git diff` reports the
  files identical while `git status` calls them modified, and
  `git checkout <branch>` refuses with "local changes would be
  overwritten". Run `git checkout -- frontend/` to put them back once
  the commit is in.
- Do not stage the files it rewrites. They belong to whatever change
  last edited them, not to the commit being blocked.

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
