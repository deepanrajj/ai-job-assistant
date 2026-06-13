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
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key"
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

Keep the terminal open while using the app. Stop it with `Ctrl+C`.

Open:

```text
http://localhost:30080
```

Backend health through the frontend proxy:

```text
http://localhost:30080/api/ai/health
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
