# Task 001 - Add PostgreSQL Docker Service Plan

Status: Completed

## Purpose

Add a local PostgreSQL service so developers can run a real database
alongside the Smart Job Tracker backend. No Flyway migrations, JPA
entities, or application connection code are in scope. This task only
makes the database available locally and documents its connection
details so future persistence tasks can reference them.

## Authoritative References

- `AGENTS.md`
- `docs/context.md`
- `docs/infrastructure.md`
- `tasks/001-add-postgresql-docker-service.md`
- `backend/AGENTS.md`

## Current State Verified

### Infrastructure

- The local runtime is **Kubernetes-first** using Docker Desktop
  Kubernetes and Kustomize (`infra/k8s/local/`).
- No `docker-compose.yml` exists; local dev targets are either
  `npm run dev` (Kubernetes cluster) or `npm run dev:local` (direct
  processes).
- Existing K8s resources: backend deployment/service, frontend
  deployment/service, one ConfigMap, one Secret example.
- `infra/k8s/local/kustomization.yaml` lists all active resource files.
- PostgreSQL is referenced as a "future" item in diagrams in
  `docs/infrastructure.md` but has no K8s manifests today.

### Backend

- No database dependencies in `backend/build.gradle.kts` (no JPA, no
  JDBC driver, no connection pool).
- `backend/src/main/resources/application.properties` has no datasource
  properties.
- There is no `.env.example` at the repo root today. `.dockerignore`
  already allowlists `.env.example` (`!.env.example`).

### Secrets and Config Patterns

- Non-secret runtime config lives in a ConfigMap
  (`infra/k8s/local/backend-configmap.yaml`).
- Secret values live in
  `infra/k8s/local/smart-job-tracker-secrets.example.yaml` with
  `replace-me` placeholders; this file is a template committed to Git
  and is **not** included in `kustomization.yaml`.
- The naming convention for all K8s resources is
  `smart-job-tracker-<component>`.

## Goal

- PostgreSQL 16 runs as a pod in the local Kubernetes cluster.
- Connection details (host, port, database, user) are visible in config
  and docs.
- The password placeholder is in the secrets example file only.
- No real credentials are committed.
- `docs/infrastructure.md` and `docs/context.md` are updated to reflect
  that PostgreSQL is now part of the local infrastructure.

## Proposed Decisions

1. Use the official `postgres:16` image; no custom Dockerfile needed.
2. Store `POSTGRES_DB` and `POSTGRES_USER` in a new ConfigMap
   (`postgres-configmap.yaml`). These are not sensitive.
3. Store `POSTGRES_PASSWORD` as a new key in the existing secrets
   example file. Never add a real password.
4. Use `emptyDir` for the PostgreSQL data volume. Local dev does not
   need data persistence across pod restarts; migrations will populate
   the schema in a later task.
5. Create a dedicated `postgres-service.yaml` (ClusterIP, port 5432) so
   the backend can reach PostgreSQL by K8s DNS name
   (`smart-job-tracker-postgres`).
6. Create `.env.example` at the repo root for developers who use
   `npm run dev:local` and need the connection details for local process
   development.
7. Update `kustomization.yaml` to include the three new postgres
   manifests (configmap, deployment, service).
8. Update diagrams and component tables in `docs/infrastructure.md` to
   reflect that PostgreSQL is now present (remove the "future" markers).
9. Update `docs/context.md` section 3 (Current State) to mention
   PostgreSQL in the local infrastructure list.
10. Do not add datasource properties to `application.properties` or any
    Spring/Kotlin backend code — that is a future persistence task.

## Files To Create

### `infra/k8s/local/postgres-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: smart-job-tracker-postgres-config
data:
  POSTGRES_DB: "smartjobtracker"
  POSTGRES_USER: "smartjobtracker"
```

### `infra/k8s/local/postgres-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-job-tracker-postgres
  labels:
    app.kubernetes.io/name: smart-job-tracker-postgres
    app.kubernetes.io/part-of: smart-job-tracker
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: smart-job-tracker-postgres
  template:
    metadata:
      labels:
        app.kubernetes.io/name: smart-job-tracker-postgres
        app.kubernetes.io/part-of: smart-job-tracker
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - name: postgres
              containerPort: 5432
          envFrom:
            - configMapRef:
                name: smart-job-tracker-postgres-config
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: smart-job-tracker-secrets
                  key: POSTGRES_PASSWORD
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          emptyDir: {}
```

### `infra/k8s/local/postgres-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: smart-job-tracker-postgres
  labels:
    app.kubernetes.io/name: smart-job-tracker-postgres
    app.kubernetes.io/part-of: smart-job-tracker
spec:
  selector:
    app.kubernetes.io/name: smart-job-tracker-postgres
  ports:
    - name: postgres
      port: 5432
      targetPort: postgres
```

### `.env.example` (repo root)

```dotenv
# PostgreSQL – used when running backend locally outside Kubernetes.
# Copy this file to .env and fill in the real password before running
# npm run dev:local.
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=smartjobtracker
POSTGRES_USER=smartjobtracker
POSTGRES_PASSWORD=replace-me
```

## Files To Update

### `infra/k8s/local/kustomization.yaml`

Add three new resources after the existing entries:

```yaml
  - postgres-configmap.yaml
  - postgres-deployment.yaml
  - postgres-service.yaml
```

### `infra/k8s/local/smart-job-tracker-secrets.example.yaml`

Add `POSTGRES_PASSWORD` alongside the existing `OPENAI_API_KEY`:

```yaml
stringData:
  OPENAI_API_KEY: replace-me
  POSTGRES_PASSWORD: replace-me
```

### `docs/infrastructure.md`

Four updates:

1. **Runtime Overview diagram** — change the dashed `-.->` PostgreSQL
   arrow to a solid `-->` arrow and remove the `"future read/write"`
   label, since PostgreSQL is now part of the local runtime.

2. **Local Kubernetes Components table** — add a PostgreSQL section:

   ```text
   PostgreSQL
     Deployment: smart-job-tracker-postgres
     Service:    smart-job-tracker-postgres
     Image:      postgres:16
     Port:       5432
   ```

3. **Configuration section** — add a PostgreSQL config block:

   ```text
   PostgreSQL runtime config comes from:

     infra/k8s/local/postgres-configmap.yaml

   Current config values:
     POSTGRES_DB    smartjobtracker
     POSTGRES_USER  smartjobtracker

   The password comes from the smart-job-tracker-secrets Secret:
     POSTGRES_PASSWORD

   In-cluster hostname: smart-job-tracker-postgres
   Port:                5432
   ```

4. **Ports section** — add:

   ```text
   PostgreSQL container:       5432
   ```

### `docs/context.md` — Section 3 Current State

Update the local infrastructure bullet list to include PostgreSQL:

```text
- PostgreSQL deployment and service for persisted tracker data
```

## Verification Plan

1. Apply the updated Kustomize manifests:
   ```bash
   kubectl apply -k infra/k8s/local/
   ```
2. Confirm the postgres pod reaches `Running` state:
   ```bash
   kubectl get pods -n smart-job-tracker
   ```
3. Verify the PostgreSQL service is reachable inside the cluster by
   exec-ing a one-shot psql command:
   ```bash
   kubectl run psql-test --rm -it --image=postgres:16 \
     --restart=Never -n smart-job-tracker -- \
     psql -h smart-job-tracker-postgres -U smartjobtracker \
     -d smartjobtracker -c '\l'
   ```
4. Confirm `.env.example` is tracked by Git (not gitignored):
   ```bash
   git status .env.example
   ```
5. Confirm no real password appears in any committed file:
   ```bash
   git diff HEAD -- infra/k8s/local/smart-job-tracker-secrets.example.yaml
   ```
6. Run `npm run verify` if any code or config that affects builds changed.

## Implementation Order

1. Create `infra/k8s/local/postgres-configmap.yaml`.
2. Create `infra/k8s/local/postgres-deployment.yaml`.
3. Create `infra/k8s/local/postgres-service.yaml`.
4. Update `infra/k8s/local/kustomization.yaml` to include the three
   new postgres files.
5. Update `infra/k8s/local/smart-job-tracker-secrets.example.yaml` to
   add `POSTGRES_PASSWORD`.
6. Create `.env.example` at the repo root.
7. Update `docs/infrastructure.md` (diagrams, components, config,
   ports).
8. Update `docs/context.md` section 3.
9. Run the verification steps above.
10. Commit with message `task-001: add postgresql docker service`.

## Scope Boundaries

- No Flyway migrations.
- No JPA entities or Spring datasource configuration.
- No application code changes in `backend/`.
- No frontend changes.
- No PersistentVolumeClaim; `emptyDir` is sufficient for local dev.
- No new npm scripts or Dockerfile changes; PostgreSQL uses the official
  image pulled from Docker Hub.

## Acceptance Criteria

- [ ] PostgreSQL pod starts and stays Running in the local cluster.
- [ ] In-cluster hostname, port, database, and user are documented in
  `docs/infrastructure.md`.
- [ ] Password exists only as a `replace-me` placeholder in
  `smart-job-tracker-secrets.example.yaml`.
- [ ] `.env.example` documents all connection details for local process
  development.
- [ ] No real secrets are committed.
- [ ] `docs/infrastructure.md` and `docs/context.md` reflect the new
  PostgreSQL service.
