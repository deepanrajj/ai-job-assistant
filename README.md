# Smart Job Tracker

Smart Job Tracker is a full-stack job search assistant that is evolving from an AI job-description analyzer into an application tracker. The current project includes a React frontend, a Spring Boot Kotlin backend, and a production-like local Kubernetes runtime.

## Current Capabilities

- Dashboard, jobs list, and job detail workflow with local tracker data
- AI job-description analysis flow
- AI follow-up question flow
- English and German translations
- Accessible reusable frontend components
- Spring Boot backend wrapper around the OpenAI Responses API
- Docker and Kubernetes manifests for local cluster execution
- Frontend and backend test coverage gates

## Tech Stack

```text
Frontend   React, TypeScript, Vite, React Router, React Hook Form, Zod, Tailwind CSS
Backend    Spring Boot, Kotlin, Spring MVC, WebClient
Quality    ESLint, Prettier, Vitest, ktlint, detekt, JaCoCo
Runtime    Docker, Kubernetes, Nginx
Provider   OpenAI API
Future     PostgreSQL, pgvector, authentication, saved jobs API
```

## Project Structure

```text
frontend/   React application
backend/    Spring Boot Kotlin API
infra/      Docker, Nginx, and Kubernetes runtime files
docs/       Architecture, setup, Swagger, infrastructure, and backlog docs
```

## Quick Start

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
npm install --prefix frontend
```

Create the local Kubernetes secret once:

```bash
npm run k8s:namespace
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key"
```

Start the production-like local Kubernetes runtime:

```bash
npm run dev
```

This builds the Docker images, loads them into Docker Desktop Kubernetes, applies the manifests, and keeps port forwarding open.

Open:

```text
http://localhost:30080
```

For direct local processes without Kubernetes, use:

```bash
npm run dev:local
```

That starts the Vite frontend and Spring Boot backend together with `concurrently`. You can also use `npm run dev:frontend` and `npm run dev:backend` in separate terminals.

## Quality Checks

Run the full project verification before pushing:

```bash
npm run verify
```

That command runs frontend linting, formatting, coverage, build, backend ktlint, detekt, tests, JaCoCo report generation, and backend coverage verification.

## Local Kubernetes

The default dev command runs the app in Docker Desktop Kubernetes:

```bash
npm run k8s:namespace
kubectl create secret generic smart-job-tracker-secrets --namespace smart-job-tracker --from-literal=OPENAI_API_KEY="your-api-key"
npm run dev
```

Open:

```text
http://localhost:30080
```

Do not commit real API keys. The committed Kubernetes secret file is only an example template.

## Documentation

- [Agent Instructions](./AGENTS.md)
- [Project Context](./docs/context.md)
- [Setup](./docs/setup.md)
- [Architecture](./docs/architecture.md)
- [Infrastructure](./docs/infrastructure.md)
- [Swagger Setup](./docs/swagger.md)
- [GitHub Pipeline](./docs/engineering/github-pipeline.md)
- [Backlog](./docs/backlog/README.md)
- [Numbered Tasks](./tasks/README.md)
