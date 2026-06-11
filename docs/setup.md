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

## Run Without Kubernetes

Start frontend and backend together:

```bash
npm run dev
```

Or start them separately:

```bash
npm run dev:frontend
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

## Run With Local Kubernetes

Create the namespace:

```bash
kubectl apply -f infra/k8s/local/namespace.yaml
```

Create the local secret:

```bash
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key"
```

Build the local Docker images:

```bash
npm run docker:build
```

Load the images into the Docker Desktop Kubernetes node:

```bash
npm run k8s:load-images
```

Apply the Kubernetes manifests:

```bash
npm run k8s:apply
```

Forward the frontend service to localhost:

```bash
npm run k8s:forward
```

Open:

```text
http://localhost:30080
```

Backend health through the frontend proxy:

```text
http://localhost:30080/api/ai/health
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

## Endpoint Discovery

Manual endpoint docs are intentionally not maintained in this repo. The preferred direction is generated Swagger/OpenAPI documentation from the backend controllers.

See:

```text
docs/swagger.md
```
