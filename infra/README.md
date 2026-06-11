# Local Kubernetes Runtime

This folder contains the production-like local runtime for Smart Job Tracker.

The setup assumes Docker Desktop has Kubernetes enabled. It builds the frontend and backend as local Docker images, then runs both through Kubernetes Deployments and Services.

For the full project setup, architecture, and API docs, see:

- [Project Setup](../docs/setup.md)
- [Infrastructure](../docs/infrastructure.md)
- [Swagger Setup](../docs/swagger.md)

## First Run

Create the namespace:

```bash
kubectl apply -f infra/k8s/local/namespace.yaml
```

Create the local secret:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key"
```

Do not commit a real API key. The file `infra/k8s/local/smart-job-tracker-secrets.example.yaml` is only a template and is not included in the kustomization.

Build the local images:

```bash
npm run docker:build
```

Load the images into the Docker Desktop Kubernetes node:

```bash
npm run k8s:load-images
```

Deploy the app:

```bash
npm run k8s:apply
```

Expose the frontend to your browser:

```bash
npm run k8s:forward
```

Open the app:

```txt
http://localhost:30080
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
