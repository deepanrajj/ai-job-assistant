# API Requests

Ready-to-run requests against the Smart Job Tracker backend.

## Two sources, on purpose

The backend already publishes a complete, generated OpenAPI document.
Hand-copying every endpoint into a Postman collection would duplicate it
and start drifting the moment a controller changes, so this folder does
not try.

| Want | Use |
| --- | --- |
| Every endpoint, every field, always current | Import the OpenAPI document |
| An ordered flow with assertions and chained ids | The collection in this folder |

### Import the generated spec

Start the backend, then in Postman choose **Import - Link** and paste:

```text
http://localhost:30080/api/v3/api-docs
```

Postman builds a request for every endpoint from the controllers and
DTOs. Re-import after adding endpoints; nothing here needs editing.

Swagger UI is the same information in a browser, and can fire requests
itself:

```text
http://localhost:30080/api/swagger-ui.html
```

Both URLs are on port 4000 instead when the backend runs as a direct
process rather than in the cluster; see Running it below.

See [`../swagger.md`](../swagger.md) for how the generation is set up.

### The collection in this folder

```text
smart-job-tracker.postman_collection.json
smart-job-tracker-cluster.postman_environment.json
smart-job-tracker-local.postman_environment.json
```

Import the collection and whichever environment matches how you are
running the backend, then select it in the environment dropdown. Both
environments define the same `baseUrl` variable and differ only in its
value, so switching runtime is switching environment.

There are two environments for three runtimes, and that is deliberate.
The Kubernetes cluster and the Docker Compose stack both publish the
frontend on port 30080, which is why only one of them can run at a time
(`docs/setup.md`). One `baseUrl` addresses both, so **Cluster** is the
environment for either of them. **Local** exists for the case that
really is different: the backend as a direct process on port 4000, with
no proxy in front of it.

What it adds over the generated spec:

- **A working CRUD cycle.** `Create job` writes the new id into the
  `jobId` collection variable, and every request after it reads that
  variable. Run the `Jobs` folder in the Collection Runner and it
  creates, lists, reads, updates, deletes, and then confirms the delete
  with a 404.
- **Assertions.** Each request checks status, shape, and error code, so
  a run is a pass or fail rather than something to read by eye.
- **Realistic bodies.** Filled-in examples rather than generated
  placeholders, including the null-clearing `PUT` body, which is easy to
  get wrong.
- **Error cases.** Blank-field validation and the not-found path, which
  a generated spec lists but cannot demonstrate.

## Running it

The default runtime is the local Kubernetes cluster:

```bash
npm run dev
```

That serves the API through the Nginx proxy on port 30080 and forwards
PostgreSQL to 5434. Use the **Cluster** environment with it.

The Docker Compose stack is the other way to get the whole thing
running:

```bash
npm run dev:compose
```

It serves the API through the same proxy on the same port, so it uses
the **Cluster** environment too. It also returns only once every service
reports healthy, which is what makes it the stack the command-line run
below targets.

To run the backend as a direct process instead, it still needs a
database, so forward PostgreSQL in one terminal:

```bash
npm run db:forward
```

and start the backend in another:

```bash
npm run dev:backend
```

That serves the API on port 4000. Use the **Local** environment with it.

## Running it from the command line

`npm run api:test` runs the collection with Newman against a stack that
is already up. It is the same command CI runs, so a failure here is the
failure the pull request will show.

Start the Docker Compose stack first:

```bash
npm run dev:compose
```

```bash
npm run api:test
```

`dev:compose` returns only once every service reports healthy, so the
run cannot race a backend that is still starting. It works against the
Kubernetes runtime as well, because both runtimes answer on port 30080
and the environment file is the same one.

The script names the folders it runs: `Health` and `Jobs`. That is an
allowlist, not a filter, and the reason is the `AI` folder. Those
requests reach OpenAI through the backend and cost money per request,
so nothing automated may run them. A folder added to the collection
later does not start running on its own; somebody has to add it to the
script on purpose.

`Health` is on the list despite the path `/api/ai/health`. That endpoint
returns a fixed `{"ok": true}` and reaches no provider. It is the same
endpoint the Kubernetes probes and the Compose healthcheck use.

The run writes a JUnit and a JSON report to `reports/newman/`, which is
gitignored. CI uploads the same two files as an artifact on every run,
so a failed assertion can be read without reproducing it locally.

Newman is not a project dependency. `npm run api:test` fetches a pinned
version with `npx`, so no install sits in `npm ci` for a tool two
commands use.

### What this is not

It is not part of `npm run verify`, and it should not become part of it.
`verify` is the pre-push gate and stays fast and hermetic; this needs a
running stack. Backend behaviour is separately covered by
`JobCrudIntegrationTest`, which exercises the real controller, service,
repository, and Flyway schema without a server at all.

What this run adds over that is the wiring: Nginx proxying `/api/`,
the backend reaching PostgreSQL over the Compose network, and the
serialised JSON a client actually receives. No unit test sees any of
those.

## Secrets

Nothing in this folder holds a credential, and nothing in it should.

The `AI` requests reach OpenAI through the backend, which reads
`OPENAI_API_KEY` from its own environment. That boundary is deliberate
(`docs/context.md` section 4): the key never reaches a browser or an API
client. Without the key configured, the AI requests return a typed
`AI_REQUEST_FAILED` error - correct behaviour, not a broken collection.

If authentication later adds a token, it goes in the environment file as
an empty placeholder and is filled in locally. Never commit a real one.

## Keeping it honest

When an endpoint changes, update the flow in the same change that
changes the controller. When an endpoint is added, decide whether it
belongs in a flow at all - if the generated spec is enough for it,
leave it out.
