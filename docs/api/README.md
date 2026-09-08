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

To run the whole folder from the command line with Newman:

```bash
npx newman run docs/api/smart-job-tracker.postman_collection.json -e docs/api/smart-job-tracker-cluster.postman_environment.json --folder Jobs
```

Newman is not a project dependency, and these requests are not part of
`npm run verify`. Backend behaviour is covered by
`JobCrudIntegrationTest`, which runs against the real controller,
service, repository, and Flyway schema without needing a running server.
This collection is for exploring a live backend by hand, not a second
test suite to keep green.

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
