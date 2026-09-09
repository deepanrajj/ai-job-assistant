---
name: stop-local
description: Stop the Smart Job Tracker local Kubernetes runtime - release port forwards, remove workloads, or tear the namespace down completely. Use when the user says "stop the app", "shut it down", "stop local", "tear down the cluster", "free port 30080", or hits an address-already-in-use error from a leftover port forward.
---

# Stop The Local Runtime

Three levels. Pick the smallest one that does what you want, because the
larger two have consequences that are annoying to undo.

## Level 1 - release the ports, leave the cluster running

`Ctrl+C` in the terminal running `npm run dev`.

That stops both port forwards. The deployments keep running inside
Kubernetes, so `npm run k8s:forward` and `npm run db:forward` bring
access straight back with no rebuild.

This is the right answer most of the time. Use it when you are done for
now, or when you need port 30080 or 5434 for something else.

### Orphaned port forwards

If `Ctrl+C` was missed, or the terminal was closed, a `kubectl
port-forward` process can survive and keep holding the port. That is
what an `address already in use` on the next start means.

Find and stop it on Windows:

```bash
netstat -ano | findstr ":30080 :5434"
```

Then stop that PID:

```bash
taskkill /PID <pid> /F
```

Confirm nothing still holds the port before restarting.

## Level 2 - stop the workloads, keep the cluster set up

```bash
kubectl scale deployment --all --replicas=0 --namespace smart-job-tracker
```

Frees CPU and memory without deleting anything. The namespace, the
secret, the config maps and the services all survive, so starting again
is one command:

```bash
kubectl scale deployment --all --replicas=1 --namespace smart-job-tracker
```

PostgreSQL data does **not** survive. Its volume is `emptyDir`, which
lives and dies with the pod, so scaling to zero empties the database.
Flyway rebuilds the schema on the next start; the rows are gone.

## Level 3 - full teardown

```bash
kubectl delete namespace smart-job-tracker
```

Removes everything: deployments, services, config maps, PostgreSQL data,
and **the secret**.

`npm run k8s:delete` does the same damage. It runs
`kubectl delete -k infra/k8s/local`, and `kustomization.yaml` lists
`namespace.yaml` as a resource, so it deletes the namespace and
everything inside it - including the secret, which the kustomization
does not manage and cannot recreate.

**After either command, the next `npm run dev` fails at
`k8s:check-secret`** until the secret is recreated:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key" --from-literal=POSTGRES_PASSWORD="your-local-db-password"
```

Reach for level 3 only to reclaim disk, or when the cluster state is
genuinely broken and worth rebuilding from nothing.

## Verify it stopped

```bash
kubectl get all --namespace smart-job-tracker
```

Level 1 still lists running pods, which is correct. Level 2 shows
deployments at `0/0`. Level 3 reports that the namespace does not exist.

Namespace deletion is not instant - it sits in `Terminating` while pods
shut down. Wait for it to disappear before starting again, or the next
apply races the teardown.

## Boundaries

- Never delete the namespace just to restart the app. Level 1 restarts
  are free; level 3 costs a secret and a database.
- Docker images are not touched by any of this. `docker:build` output
  stays cached, which is why restarts are quick.
- Stopping the runtime is not a fix for a failing test or a build error.
  Diagnose those where they happen.
