# Smart Job Tracker - Authoritative Context

## Purpose

This document is the product and architecture source of truth for
agent-driven development in Smart Job Tracker. Agents should read it
before making product, architecture, backend, frontend, infrastructure,
or backlog changes.

## 1. Product Vision

Smart Job Tracker is evolving from an AI job-description assistant into
a full job-search tracking product.

The app should help a user:

- save jobs they are interested in
- track application status
- manage preparation tasks and notes
- review activity through a timeline
- discover and import job opportunities
- manage contacts, reminders, application documents, and calendar events
- maintain reusable resume profiles and skills inventory
- use AI to analyze job descriptions and prepare better applications
- later persist tracker data in a backend database

The first product target is a portfolio-ready full-stack app with a
clean frontend, Spring Boot Kotlin backend, AI provider integration,
local Kubernetes runtime, tests, and clear documentation.

Final product navigation:

- Dashboard
- Jobs
- Discover
- Applications
- Calendar
- Profile

Product sequencing:

1. Build the non-AI tracker until it is useful on its own.
2. Add advanced non-AI workflows for discovery, reminders, contacts,
   documents, calendar, and profile management.
3. Integrate AI into those workflows instead of keeping AI as a
   standalone assistant.
4. Finish with authentication, user-owned data, deployment, and
   portfolio polish.

## 2. Locked Tech Stack

Frontend:

- React 19
- TypeScript
- Vite
- React Router 7
- Tailwind CSS 4
- React Hook Form
- Zod
- Vitest and React Testing Library

Backend:

- Kotlin
- Spring Boot
- Spring MVC controllers
- WebClient for outbound OpenAI calls
- Bean Validation
- Springdoc OpenAPI
- ktlint, detekt, JaCoCo

Runtime and infrastructure:

- Docker
- Docker Desktop Kubernetes for local production-like development
- Nginx frontend container for static assets and `/api` proxying
- PostgreSQL planned for persisted tracker data
- Stripe test mode planned for paid AI checkout and subscription testing

## 3. Current State

Frontend currently has:

- app shell and routing
- dashboard
- jobs list
- job detail page with overview, tasks, notes, timeline, and AI tabs
- create/edit job forms
- localStorage-backed job persistence
- English and German translations
- reusable UI, form, table, icon, and layout components
- frontend tests and coverage gate

Backend currently has:

- Spring Boot Kotlin application under `com.smartjobtracker`
- AI endpoints under `/api/ai`
- OpenAI Responses API wrapper
- structured AI response mapping
- global API error model and handler
- request validation
- generated Swagger/OpenAPI documentation
- backend tests and coverage gate

Local infrastructure currently has:

- backend Dockerfile
- frontend Dockerfile
- Nginx config
- Kubernetes namespace, deployments, services, and config map
- example Kubernetes secret manifest
- local image loading script for Docker Desktop Kubernetes
- PostgreSQL deployment and service (ephemeral emptyDir storage; data resets on pod recreation until schema migrations land)

## 4. AI Boundary

- The backend owns OpenAI calls.
- The frontend calls the backend API only.
- Do not expose OpenAI API keys to the browser.
- Do not commit API keys or local secret values.
- Do not log raw job descriptions, prompts, or full provider responses.
- AI output may be saved as tracker data only through app-owned models.

## 5. Planned Persistence Model

The planned tracker database model is:

```text
Job
  id, userId, company, roleTitle, location, status, jobUrl,
  salaryMin, salaryMax, description, createdAt, updatedAt

Task
  id, jobId, title, status, dueDate, createdAt, updatedAt

Note
  id, jobId, body, createdAt, updatedAt

TimelineEvent
  id, jobId, type, description, createdAt

AiOutput
  id, jobId, userId, type, contentJson, createdAt

Contact
  id, jobId, type, name, emailOrUrl, notes, createdAt, updatedAt

Reminder
  id, jobId, type, title, dueDate, completedAt, createdAt, updatedAt

ApplicationDocument
  id, jobId, type, title, contentJson, submittedAt, createdAt, updatedAt

SavedSearch
  id, userId, criteriaJson, createdAt, updatedAt

ImportCandidate
  id, userId, source, sourceUrl, contentJson, duplicateStatus, reviewStatus

ResumeProfile
  id, userId, name, profileJson, createdAt, updatedAt

AiUsageEntitlement
  id, userId, freeCreditsRemaining, stripeCustomerId, subscriptionStatus

AiUsageEvent
  id, userId, operation, creditConsumed, status, createdAt
```

Frontend localStorage is temporary. It lets the UI behave like a real
tracker until backend job APIs exist.

## 6. API Direction

Current API:

- `GET /api/ai/health`
- `POST /api/ai/analyze-job`
- `POST /api/ai/ask-job`
- Swagger UI at `/api/swagger-ui.html`
- OpenAPI docs at `/api/v3/api-docs`

Planned API areas:

- jobs CRUD
- job tasks CRUD
- job notes CRUD
- timeline event reads
- job contacts
- reminders and calendar events
- application documents and submitted application metadata
- saved searches and imported job candidates
- deterministic duplicate detection
- resume profiles, skills inventory, and job preferences
- saved AI outputs
- authentication and user-owned jobs
- billing and AI usage:
  - `GET /api/billing/ai-usage`
  - `POST /api/billing/checkout-session`
  - `POST /api/billing/customer-portal`
  - `POST /api/billing/stripe-webhook`
- AI job discovery, resume extraction, fit ranking, CV draft generation,
  and application material generation

## 7. Local Runtime

Default development runtime is local Kubernetes:

```bash
npm run dev
```

This checks the namespace and secret, builds Docker images, loads images
into Docker Desktop Kubernetes, applies manifests, and starts port
forwarding.

Direct local process development is available:

```bash
npm run dev:local
```

Use `docs/setup.md` and `docs/infrastructure.md` for setup and runtime
details.

## 8. Quality Gates

Use these commands:

```bash
npm run frontend:verify
npm run backend:verify
npm run verify
```

Frontend verification includes linting, Prettier check, coverage, and
build. Backend verification includes ktlint check, detekt, tests, JaCoCo
report, and coverage verification.

## 9. Documentation Map

- `AGENTS.md` - repo-wide agent rules.
- `frontend/AGENTS.md` - frontend-specific rules.
- `backend/AGENTS.md` - backend-specific rules.
- `docs/setup.md` - setup instructions.
- `docs/architecture.md` - diagrams and architecture overview.
- `docs/infrastructure.md` - Docker and Kubernetes runtime.
- `docs/swagger.md` - generated API docs setup.
- `docs/backlog/` - phase roadmap.
- `tasks/` - execution-ready numbered tasks.
- `templates/task-template.md` - canonical task file template.

## 10. Non-Goals For Now

- No direct OpenAI calls from the frontend.
- No new frontend state library unless explicitly requested.
- No new styling system unless explicitly requested.
- No backend database schema without Flyway once Flyway is introduced.
- No authentication shortcut that makes user-specific data unsafe.
- No paid AI enforcement before authentication and user-owned data exist.
- No secret values committed to the repository.
- No broad refactors hidden inside feature tasks.

## 11. Agent Rules Summary

Agents must:

- follow `AGENTS.md`
- read app-specific AGENTS files before editing app code
- keep changes scoped to one task
- update tests for production behavior changes
- update docs when a change affects documented behavior
- ask before changing locked product or architecture decisions

Agents must not:

- invent new APIs or schemas outside the task scope
- bypass the backend AI boundary
- introduce libraries without explicit approval
- weaken tests to pass validation
- commit secrets or generated build artifacts

## 12. Final Product Direction

The final app should feel like a cohesive job-search operating system,
not a collection of disconnected tools.

`AI Assistant` is not a final top-level navigation item. The current
analyzer can remain during development, but final AI behavior should
appear as workflow actions such as:

- analyze job
- find/import jobs
- rank fit
- generate CV draft
- create cover letter
- save as note, document, or task

Duplicate detection has two product modes:

- Discover/import candidates are classified before saving as new, likely
  duplicate, or possible duplicate. Likely duplicates are excluded from
  default bulk import.
- Manual add/edit may show a non-blocking duplicate warning, but the user
  can still create or update the job.

First CV generation output is an editable in-app draft. PDF/DOCX export
is a later enhancement.

Paid AI rules:

- Stripe test mode is the planned payment provider.
- Each signed-in user receives 10 one-time free AI credits.
- Each successful AI operation consumes 1 credit.
- Validation failures and failed OpenAI/provider calls do not consume
  credits.
- After free credits are exhausted, unpaid users receive
  `402 AI_PAYMENT_REQUIRED` from AI endpoints.
- Active paid subscriptions unlock AI usage after free credits are
  exhausted.

Deferred AI ideas:

- pgvector, embeddings, job chunks, and RAG answers over saved job
  content are deferred until the workflow-integrated AI product is
  cohesive.
