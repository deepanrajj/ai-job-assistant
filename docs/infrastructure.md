# Infrastructure

The local infrastructure is designed to feel close to production while still running on a developer machine.

## Runtime Overview

```mermaid
flowchart LR
  Browser["Browser"] --> FrontendService["Frontend Service"]
  FrontendService --> FrontendPod["Frontend Pod: Nginx + React build"]
  FrontendPod -->|"serves static files"| Browser
  FrontendPod -->|"/api/* proxy"| BackendService["Backend Service"]
  BackendService --> BackendPod["Backend Pod: Spring Boot Kotlin"]
  BackendPod -->|"AI provider call"| OpenAI["OpenAI API"]
  BackendPod -. "future read/write" .-> Database["PostgreSQL"]
  BackendPod -. "future billing" .-> Stripe["Stripe test mode"]
```

## Local Kubernetes Components

```text
Namespace
  smart-job-tracker

Frontend
  Deployment: smart-job-tracker-frontend
  Service:    smart-job-tracker-frontend
  Container:  Nginx serving frontend/dist
  Port:       80

Backend
  Deployment: smart-job-tracker-backend
  Service:    smart-job-tracker-backend
  Container:  Spring Boot Kotlin app
  Port:       4000

Config
  ConfigMap:  smart-job-tracker-backend-config
  Secret:     smart-job-tracker-secrets
```

## Request Flow

```mermaid
sequenceDiagram
  participant User as User Browser
  participant Nginx as Frontend Nginx
  participant Backend as Spring Boot API
  participant OpenAI as OpenAI API
  participant Stripe as Stripe Future
  participant DB as PostgreSQL Future

  User->>Nginx: Open /dashboard or /jobs
  Nginx-->>User: React app
  User->>Nginx: POST /api/ai/analyze-job
  Nginx->>Backend: Proxy /api/ai/analyze-job
  Backend-.->>DB: Future check AI credits or paid entitlement
  Backend->>OpenAI: Structured AI request
  OpenAI-->>Backend: Structured AI response
  Backend-.->>Stripe: Future checkout or subscription portal
  Backend-.->>DB: Future save job analysis
  Backend-->>Nginx: JSON response
  Nginx-->>User: JSON response
```

## Provider vs Database Calls

Current AI endpoints call the external provider directly and do not persist results yet.

```mermaid
flowchart TD
  Analyze["Analyze job description"] --> Api["Backend API"]
  Ask["Ask question about job"] --> Api

  Api -->|"current external provider call"| OpenAI["OpenAI API"]
  Api -. "future saved jobs" .-> JobsDb["PostgreSQL: jobs"]
  Api -. "future notes/tasks/timeline" .-> TrackerDb["PostgreSQL: tracker data"]
  Api -. "future AI credits and subscriptions" .-> BillingDb["PostgreSQL: billing state"]
  Api -. "future checkout and webhooks" .-> Stripe["Stripe test mode"]
```

pgvector, embeddings, job chunks, and RAG over saved job content are
deferred product ideas, not part of the active local infrastructure plan.

## Docker Images

Backend image:

```text
smart-job-tracker-backend:local
```

Built from:

```text
infra/docker/backend.Dockerfile
```

Frontend image:

```text
smart-job-tracker-frontend:local
```

Built from:

```text
infra/docker/frontend.Dockerfile
```

## Nginx Proxy

The frontend container uses Nginx:

```text
infra/docker/nginx.conf
```

Responsibilities:

- Serve the React production build.
- Rewrite frontend deep links to `index.html`.
- Proxy `/api/*` requests to the backend service.
- Expose `/healthz` for Kubernetes probes.

## Configuration

Backend runtime config comes from:

```text
infra/k8s/local/backend-configmap.yaml
```

Current config values:

```text
OPENAI_BASE_URL
OPENAI_MODEL
```

Sensitive values come from a Kubernetes Secret:

```text
smart-job-tracker-secrets
```

Current secret keys:

```text
OPENAI_API_KEY
```

The committed file `infra/k8s/local/smart-job-tracker-secrets.example.yaml` is only a template. Do not add it to `kustomization.yaml` with a real API key.

## Ports

```text
Local Vite frontend:        5173
Local Spring Boot backend:  4000
Kubernetes frontend proxy:  30080 through kubectl port-forward
Frontend container:         80
Backend container:          4000
```

## Why Image Loading Is Needed Locally

Docker Desktop Kubernetes can run its node through `containerd`, so images visible through `docker images` are not always visible to Kubernetes pods.

The script below imports local images into the Kubernetes node:

```bash
npm run k8s:load-images
```

Run it after rebuilding images and before restarting workloads.
