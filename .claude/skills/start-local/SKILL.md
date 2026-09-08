---
name: start-local
description: Start the Smart Job Tracker local Kubernetes runtime - build images, load them into Docker Desktop Kubernetes, apply manifests, and forward ports. Use when the user says "start the app", "run it locally", "bring up the cluster", "start local", "spin up the environment", or asks why the local stack will not come up.
---

# Start The Local Runtime

The whole thing is one command:

```bash
npm run dev
```

Leave that terminal open. It holds the port forwards; closing it stops
them.

## What that command actually does

`dev` is `dev:cluster`, which chains seven steps. Knowing them is what
lets you diagnose a failure rather than re-running the whole thing:

| Step | Script | Purpose |
| --- | --- | --- |
| 1 | `k8s:namespace` | `kubectl apply -f infra/k8s/local/namespace.yaml` |
| 2 | `k8s:check-secret` | aborts unless `smart-job-tracker-secrets` holds both keys |
| 3 | `docker:build` | builds `smart-job-tracker-backend:local` and `-frontend:local` |
| 4 | `k8s:load-images` | streams both images into the Kubernetes node |
| 5 | `k8s:apply` | `kubectl apply -k infra/k8s/local` |
| 6 | `k8s:wait` | waits for every deployment to report available, 120s timeout |
| 7 | `k8s:forward` + `db:forward` | frontend on 30080, PostgreSQL on 5434, run concurrently |

Step 1 looks redundant because `kustomization.yaml` already lists
`namespace.yaml`, so step 5 would create it anyway. It runs first
because step 2 queries a secret *inside* that namespace and needs it to
exist. Do not "optimise" it away.

Step 4 is not optional and not a speed-up. Both deployments set
`imagePullPolicy: Never`, so a pod that cannot find the image locally
fails with `ErrImageNeverPull` rather than pulling from a registry.

## Preflight

Check these before running anything. `npm run dev` builds Docker images
at step 3, so a cluster problem discovered at step 5 has already cost
several minutes.

```bash
kubectl config current-context && kubectl get nodes && docker info --format '{{.ServerVersion}}'
```

Expect a context name, one node in `Ready`, and a Docker version.

`current-context is not set`, or `kubectl` retrying
`http://localhost:8080`, means there is no cluster configured at all -
that address is its fallback when the kubeconfig has no clusters in it.
Confirm with `kubectl config get-contexts`; an empty table and a
28-byte `~/.kube/config` containing only `apiVersion: v1` and
`kind: Config` mean Kubernetes has never been enabled in Docker Desktop.

Enabling it is a Docker Desktop settings change, so ask the user to do
it rather than doing it for them: **Settings - Kubernetes - Enable
Kubernetes - Apply & Restart**, then wait for the indicator to turn
green. The first provision pulls control-plane images and is not quick.

Note the node name that `kubectl get nodes` prints. `k8s:load-images`
defaults to `desktop-control-plane`; a different name needs
`K8S_NODE_NAME` set to match.

A freshly enabled cluster has no namespace and no secret, so create both
before the first `npm run dev`.

## Prerequisites

- Docker Desktop running, with Kubernetes enabled and green.
- `kubectl` pointing at the Docker Desktop context.
- The secret exists. It is not in source control, so it must be created
  once per cluster, and again after any teardown that removed the
  namespace:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key" --from-literal=POSTGRES_PASSWORD="your-local-db-password"
```

The `k8s:create-secret` script in `package.json` reads `$OPENAI_API_KEY`
with POSIX syntax. npm runs scripts through `cmd.exe` on Windows, which
does not expand `$VAR`, so on this machine use the `kubectl` command
above directly rather than that script.

## Running the steps by hand

Only when a step failed and you are retrying from there, or when you
deliberately want to skip rebuilding. Same order:

```bash
npm run k8s:namespace && npm run k8s:check-secret && npm run docker:build && npm run k8s:load-images && npm run k8s:apply && npm run k8s:wait
```

Then, in two terminals:

```bash
npm run k8s:forward
```

```bash
npm run db:forward
```

Skipping `k8s:wait` before forwarding is the usual cause of a port
forward that connects and then immediately drops: there is no ready pod
behind the service yet.

`db:forward` is only for tools on the host - a database client, or a
backend run with `npm run dev:backend`. The in-cluster backend reaches
PostgreSQL through the service and does not need it.

After changing only application code, `npm run k8s:restart` rolls both
deployments without a full re-apply - but rebuild and reload the images
first, or the restart brings back the same code.

## Verify it came up

```bash
kubectl get pods --namespace smart-job-tracker
```

Every pod should be `Running` with all containers ready. Then:

```text
http://localhost:30080
http://localhost:30080/api/ai/health
```

The health endpoint returning `{"ok":true}` means the frontend proxy and
the backend are both wired up.

`ai/health` does not touch the database, so prove the persistence path
separately with a create and a delete:

```bash
curl -s -X POST http://localhost:30080/api/jobs -H "Content-Type: application/json" -d '{"company":"Smoke Test Corp","roleTitle":"Backend Engineer"}'
```

A `201` with a generated `id` and `"status":"WISHLIST"` means the
controller, service, repository, and Flyway-created schema all work.
Delete it afterwards so the check leaves no rows behind:

```bash
curl -s -X DELETE http://localhost:30080/api/jobs/<id> -w "%{http_code}\n"
```

## When it will not start

| Symptom | Cause | Fix |
| --- | --- | --- |
| `current-context is not set`, or kubectl retries `localhost:8080` | Kubernetes not enabled in Docker Desktop; the kubeconfig has no clusters | see Preflight - the user enables it in Docker Desktop settings |
| Step 1 fails on `kubectl apply` but Docker itself is fine | same cause; a running Docker daemon says nothing about Kubernetes | as above |
| Fails immediately at step 2, no useful message | secret missing, or it exists with only one of the two keys | recreate it with the `kubectl create secret` command above |
| `ErrImageNeverPull` or `ImagePullBackOff` | images never reached the node | `npm run docker:build && npm run k8s:load-images` |
| `k8s:load-images` fails on `docker exec` | node name is not `desktop-control-plane` | `kubectl get nodes`, then set `K8S_NODE_NAME` to the real name |
| `k8s:wait` times out | a pod is crash-looping | `kubectl describe pod <name> -n smart-job-tracker` and `kubectl logs <name> -n smart-job-tracker` |
| Backend pod shows 1-2 restarts but is now `Running` and ready | expected on a cold cluster: the backend booted before PostgreSQL accepted connections, so Flyway failed and the pod restarted until it could connect | nothing to do; there is no startup ordering, so the restart *is* the retry |
| Backend pod crash-loops and never becomes ready | password does not match the secret, or PostgreSQL itself is failing | check the postgres pod first, then `kubectl logs deployment/smart-job-tracker-backend -n smart-job-tracker --previous` for the real cause |
| Pods stuck in `CreateContainerConfigError` | the secret exists but is missing a key a deployment references | check both keys are present, then `kubectl rollout restart` the affected deployment |
| `address already in use` on 30080 or 5434 | a port forward from an earlier run is still alive | see the `stop-local` skill |
| Data from the last session is gone | expected | PostgreSQL uses `emptyDir`; recreating the pod resets it |

## Boundaries

- Do not edit manifests to work around a startup failure. Fix the cause.
- Do not commit `infra/k8s/local/smart-job-tracker-secrets.yaml` or any
  real key.
- `npm run dev:local` is a different runtime, not a fallback for this
  one. It runs the backend as a host process and still needs PostgreSQL
  forwarded with `npm run db:forward`.
