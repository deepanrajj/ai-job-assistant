# Local Runtimes

This folder contains the production-like local runtimes for Smart Job Tracker.

The default runtime assumes Docker Desktop has Kubernetes enabled. It builds the frontend and backend as local Docker images, then runs both through Kubernetes Deployments and Services.

A Docker Compose runtime is available as an alternative for developers who do not want to enable Kubernetes. It uses the same Dockerfiles, the same Nginx config, and the same image tags. See [Docker Compose Alternative](#docker-compose-alternative) below.

For the full project setup, architecture, and API docs, see:

- [Project Setup](../docs/setup.md)
- [Infrastructure](../docs/infrastructure.md)
- [Swagger Setup](../docs/swagger.md)

## First Run

Create the namespace:

```bash
npm run k8s:namespace
```

Create the local secret:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key" --from-literal=POSTGRES_PASSWORD="your-local-db-password"
```

Both keys are required. `npm run dev` runs `k8s:check-secret` before it builds anything, and that check aborts if either is missing.

Do not commit a real API key. The file `infra/k8s/local/smart-job-tracker-secrets.example.yaml` is only a template and is not included in the kustomization.

Start the cluster runtime:

```bash
npm run dev
```

The dev command builds the images, loads them into the Docker Desktop Kubernetes node, applies the manifests, and forwards the frontend service to your browser.

Open the app:

```txt
http://localhost:30080
```

Keep the terminal open while using the app. Stop it with `Ctrl+C`.

## Docker Compose Alternative

Runs the same three parts as plain containers, defined in
`infra/docker/compose.yaml`.

Optionally create the environment file. Every variable has a working
default, so the stack starts without it:

```bash
cp infra/docker/.env.example infra/docker/.env
```

Start, watch, and stop:

```bash
npm run dev:compose
npm run compose:logs
npm run compose:down
```

`npm run compose:reset` also deletes the PostgreSQL volume. Unlike the
Kubernetes runtime, Compose keeps the database between restarts.

The app is at the same address either way:

```txt
http://localhost:30080
```

That is also the catch. Both runtimes publish `30080` and `5434`, so
only one can run at a time. Stop one before starting the other.

Do not commit `infra/docker/.env`. It is gitignored;
`infra/docker/.env.example` is the committed template and holds
placeholders only.

## Manual Runtime Commands

The `npm run dev` command is made from these smaller commands:

```bash
npm run docker:build
npm run k8s:load-images
npm run k8s:apply
npm run k8s:forward
```

## Update After Code Changes

Rebuild the images:

```bash
npm run docker:build
npm run k8s:load-images
```

Restart the Kubernetes workloads:

```bash
npm run k8s:restart
```

Docker Desktop Kubernetes runs the node with `containerd`, so images shown by `docker images` may not always be visible to Kubernetes. The `k8s:load-images` script saves the local Docker images and imports them into the Kubernetes node.

The Docker Desktop kind node does not automatically publish Kubernetes `NodePort` services to Windows `localhost`. The `k8s:forward` script keeps the app reachable at `http://localhost:30080` while it is running.

## Useful Commands

Check pods:

```bash
kubectl get pods --namespace smart-job-tracker
```

Check services:

```bash
kubectl get services --namespace smart-job-tracker
```

Backend health check through the frontend proxy:

```txt
http://localhost:30080/api/ai/health
```

Remove the local runtime:

```bash
npm run k8s:delete
```

Delete the namespace and local secret:

```bash
kubectl delete namespace smart-job-tracker
```
