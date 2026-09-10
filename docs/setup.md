# Project Setup

This guide explains how to run Smart Job Tracker locally for development and how to run the production-like local Kubernetes setup.

## Prerequisites

Install these tools before starting:

```text
Node.js 22 or newer
npm
Java 21
Docker Desktop
Docker Desktop Kubernetes
kubectl
Git
```

For AI requests, you also need an OpenAI API key. Keep it local and never commit it.

## Install Dependencies

From the repository root:

```bash
npm install
npm install --prefix frontend
```

The backend uses the Gradle wrapper from `backend/`, so no separate Gradle install is required.

## Run With Local Kubernetes

This is the default dev path for the project.

Create the namespace:

```bash
npm run k8s:namespace
```

Create the local secret:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key" --from-literal=POSTGRES_PASSWORD="your-local-db-password"
```

Then start the cluster runtime:

```bash
npm run dev
```

The dev command:

- checks that the namespace exists
- checks that the local secret exists
- builds the frontend and backend Docker images
- loads the images into the Docker Desktop Kubernetes node
- applies the Kubernetes manifests
- forwards the frontend service to `http://localhost:30080`
- forwards PostgreSQL to `localhost:5434`

Keep the terminal open while using the app. Stop it with `Ctrl+C`.

Open:

```text
http://localhost:30080
```

Backend health through the frontend proxy:

```text
http://localhost:30080/api/ai/health
```

## Run With Docker Compose

Use this when you want the full stack without enabling Docker Desktop
Kubernetes. It runs the same three parts, from the same Dockerfiles and
the same image tags, as plain containers.

Compose and local Kubernetes are alternatives, not complements. Both
publish the frontend on `30080` and PostgreSQL on `5434`, so whichever
starts second fails to bind. Stop one before starting the other.

Optionally create the environment file:

```bash
cp infra/docker/.env.example infra/docker/.env
```

Every variable has a working default, so the stack starts without this
file. Create it to supply an OpenAI key or to change the database
credentials. `infra/docker/.env` is gitignored.

Start the stack:

```bash
npm run dev:compose
```

This builds both images, tags them `smart-job-tracker-backend:local` and
`smart-job-tracker-frontend:local`, and starts the containers in the
background. The first build runs a full Gradle build inside Docker and
takes several minutes.

Open:

```text
http://localhost:30080
```

Backend health through the frontend proxy:

```text
http://localhost:30080/api/ai/health
```

Follow the logs:

```bash
npm run compose:logs
```

Stop the stack, keeping the database:

```bash
npm run compose:down
```

Stop the stack and delete the database volume:

```bash
npm run compose:reset
```

### Compose Environment Variables

All of these are optional. The defaults come from
`infra/docker/compose.yaml`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | none | Required only by the `/api/ai/*` endpoints. Compose warns when it is unset and the rest of the app works normally. |
| `OPENAI_BASE_URL` | `https://api.openai.com` | AI provider endpoint. |
| `OPENAI_MODEL` | `gpt-5.4` | AI model name. |
| `POSTGRES_DB` | `smartjobtracker` | Database name. Also used to build the backend's `DB_URL`. |
| `POSTGRES_USER` | `smartjobtracker` | Database user, shared by PostgreSQL and the backend datasource. |
| `POSTGRES_PASSWORD` | `smartjobtracker` | Database password, shared the same way. |

The database password has a default here because it is the same value
`backend/src/main/resources/application.properties` already commits, and
the database is published only on `localhost`. Local Kubernetes is
different: there the password comes from the `smart-job-tracker-secrets`
Secret and has no default.

`POSTGRES_DB` and `POSTGRES_USER` only take effect on the first start.
The PostgreSQL image initialises the database once, so changing them
later does nothing until you run `npm run compose:reset`.

### Database Differences From Kubernetes

Compose keeps PostgreSQL data in a named volume, so it survives
`npm run compose:down` and a restart. The Kubernetes runtime uses an
`emptyDir` and loses the database whenever the pod is recreated.

Because Compose publishes PostgreSQL on the same `5434` the Kubernetes
port-forward uses, you can also run the database alone and point the
host processes from `npm run dev:local` at it:

```bash
docker compose -f infra/docker/compose.yaml up -d smart-job-tracker-postgres
```

## Run Without Kubernetes

Use these commands when you specifically want direct local processes instead of the cluster runtime.

Start frontend and backend together with `concurrently`:

```bash
npm run dev:local
```

Start the frontend:

```bash
npm run dev:frontend
```

Start the backend in another terminal:

```bash
npm run dev:backend
```

Use the debug backend command only when you want to attach a debugger:

```bash
npm run dev:backend:debug
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000/api
Health:   http://localhost:4000/api/ai/health
```

## Configure the AI Key Locally

Set the API key in your shell before starting the backend.

PowerShell:

```powershell
$env:OPENAI_API_KEY="your-api-key"
npm run dev:backend
```

Command Prompt:

```bat
set OPENAI_API_KEY=your-api-key
npm run dev:backend
```

The backend also supports:

```text
OPENAI_BASE_URL
OPENAI_MODEL
```

Defaults are defined in `backend/src/main/resources/application.properties`.

## Database And Migrations

The backend connects to PostgreSQL through:

```text
DB_URL
DB_USER
DB_PASSWORD
```

In local Kubernetes, `DB_URL` and `DB_USER` come from
`infra/k8s/local/backend-configmap.yaml`, and `DB_PASSWORD` comes from
the `POSTGRES_PASSWORD` key in the `smart-job-tracker-secrets` Secret.

When running the backend directly with `npm run dev:backend`, make sure
PostgreSQL is reachable from the host. The backend defaults to:

```text
jdbc:postgresql://localhost:5434/smartjobtracker
```

Flyway runs automatically on backend startup. Migration files live in:

```text
backend/src/main/resources/db/migration
```

Use this naming convention for new migrations:

```text
V<version>__<snake_case_description>.sql
```

## Useful Kubernetes Commands

Check pods:

```bash
kubectl get pods --namespace smart-job-tracker
```

Check services:

```bash
kubectl get services --namespace smart-job-tracker
```

Restart workloads after rebuilding and loading images:

```bash
npm run k8s:restart
```

Remove the local runtime:

```bash
npm run k8s:delete
```

Delete the namespace and local secret:

```bash
kubectl delete namespace smart-job-tracker
```

## Quality Checks

Run all checks before pushing:

```bash
npm run verify
```

Frontend only:

```bash
npm run frontend:verify
```

Backend only:

```bash
npm run backend:verify
```

## Troubleshooting

When a runtime or verification command fails for reasons that look
environmental rather than code-related, check
[Local Runtime And Environment Traps](./engineering/local-runtime-environment.md)
before digging further. It covers container DNS and healthchecks,
Compose variable and `.env` handling, the port conflict between the two
local runtimes, and the workarounds that apply only to one machine.

For Kubernetes startup failures specifically, the `start-local` skill
carries a symptom table for the cluster runtime.

## Endpoint Discovery

Manual endpoint docs are intentionally not maintained in this repo. The preferred direction is generated Swagger/OpenAPI documentation from the backend controllers.

See:

```text
docs/swagger.md
```
