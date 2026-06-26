# Smart Job Tracker Architecture

## System Overview

Current runtime:

```mermaid
flowchart LR
  User["User"] --> Frontend["React Frontend"]

  Frontend --> Router["React Router"]
  Frontend --> UI["Reusable UI Components"]
  Frontend --> Services["Frontend Services"]

  Router --> Dashboard["Dashboard"]
  Router --> JobsList["Jobs List"]
  Router --> AiAssistant["AI Assistant"]
  Router --> NotFound["Not Found"]

  Services --> Api["Spring Boot Kotlin API"]
  Api --> AiModule["AI Module"]
  AiModule --> OpenAI["OpenAI API"]
```

Planned tracker runtime:

```mermaid
flowchart LR
  Frontend["React Frontend"] --> Api["Spring Boot Kotlin API"]

  Api --> AiModule["AI Module"]
  Api -. future .-> JobModule["Job Module"]
  Api -. future .-> TaskModule["Task Module"]
  Api -. future .-> NoteModule["Note Module"]
  Api -. future .-> TimelineModule["Timeline Module"]
  Api -. future .-> AuthModule["Auth Module"]

  AiModule --> OpenAI["OpenAI API"]
  JobModule --> Database["PostgreSQL"]
  TaskModule --> Database
  NoteModule --> Database
  TimelineModule --> Database
  AuthModule --> Database

  AiModule -. future .-> VectorStore["pgvector Job Chunks"]
  VectorStore --> Database
```

## Request Flows

AI analysis currently calls the external provider and returns the result to the frontend. It does not write to a database yet.

```mermaid
sequenceDiagram
  participant User as User
  participant Frontend as React Frontend
  participant Backend as Spring Boot API
  participant OpenAI as OpenAI API
  participant DB as PostgreSQL Future

  User->>Frontend: Paste job description
  Frontend->>Backend: POST /api/ai/analyze-job
  Backend->>OpenAI: Request structured job analysis
  OpenAI-->>Backend: Structured response
  Backend-.->>DB: Future save analysis with job
  Backend-->>Frontend: Analysis JSON
  Frontend-->>User: Render analysis
```

Provider and database responsibilities:

```mermaid
flowchart TD
  Frontend["Frontend service call"] --> Backend["Backend API"]

  Backend -->|"current: AI analysis and Q&A"| Provider["OpenAI Provider"]
  Backend -. "future: jobs, tasks, notes, timeline" .-> Database["PostgreSQL"]
  Backend -. "future: semantic search" .-> VectorStore["pgvector"]
```

## Frontend Structure

```text
frontend/src
  components
    appShell
    dataTable
    form
    header
    icons
    languageSelect
    sectionCard
    seniorityBadge
    ui
  data
    mockJobs.ts
    mockJobDetails.ts
  errors
  features
    analyzeJob
    askJob
    dashboard
    jobDetail
    jobs
  hooks
    useAsyncMutation
    useMediaQuery
  i18n
  pages
    analyzeJob
    dashboard
    jobDetail
    jobs
    notFound
  routes
  services
    ai
    api
  types
    ask
    error
    job
    analysis
```

## Backend Structure

```text
backend/src/main/kotlin/com/smartjobtracker
  ai
    client
    dto
    mapper
    prompt
    schema
  api
    error
  config
```

## Core Data Model

```text
User
  id, name, email, passwordHash

Job
  id, userId, company, roleTitle, location, status, jobUrl,
  salaryMin, salaryMax, description, createdAt, updatedAt

Task
  id, jobId, title, status, priority, dueDate, createdAt, updatedAt

Note
  id, jobId, content, createdAt, updatedAt

TimelineEvent
  id, jobId, type, fromStatus, toStatus, description, createdAt

AiOutput
  id, jobId, type, contentJson, createdAt

JobChunk
  id, jobId, chunkText, chunkIndex, embedding, createdAt
```

## Implementation Direction

1. Finish the frontend MVP with mock data and local persistence.
2. Add the Spring Boot Kotlin backend with PostgreSQL.
3. Replace mock data with API services.
4. Move AI features into saved job workflows.
5. Add auth, tests, Docker, deployment, and README polish.
