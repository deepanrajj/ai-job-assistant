# Final Smart Job Tracker Roadmap

## Product Vision

Smart Job Tracker should become a job-search operating system: a place to
discover opportunities, track applications, manage follow-ups, prepare
materials, and use AI only where it improves a concrete workflow.

The non-AI tracker must be useful on its own. AI is integrated later into
discovery, deduplication, resume/profile matching, and application
material generation.

## Final Navigation

```text
Dashboard
Jobs
Discover
Applications
Calendar
Profile
```

- `Dashboard`: insights, next actions, reminders.
- `Jobs`: saved jobs, Kanban pipeline, job detail.
- `Discover`: job search/import, saved searches, duplicate review.
- `Applications`: CV drafts, cover letters, submitted documents.
- `Calendar`: interviews, deadlines, follow-ups, task due dates.
- `Profile`: resume profiles, skills inventory, job preferences.

## Non-AI Product Foundation

The non-AI app owns the core behavior:

- persisted jobs, tasks, notes, timeline events
- Kanban pipeline
- source tracking
- contacts
- reminders
- application documents
- calendar events
- dashboard insights
- saved searches
- import candidate review
- deterministic duplicate detection
- resume profiles and skills inventory

Duplicate behavior is different by workflow:

- Discover/import candidates are classified before saving as new, likely
  duplicate, or possible duplicate. Likely duplicates are excluded from
  default bulk import.
- Manual add/edit shows a non-blocking warning when a similar job exists,
  but still allows the user to create or update the job.

## Integrated AI Direction

`AI Assistant` is not a final top-level navigation item. AI should appear
as task-specific actions inside product workflows:

- analyze job
- find/import jobs
- rank fit
- generate CV draft
- create cover letter
- create recruiter or LinkedIn outreach message
- save output as note, document, or task

AI-found jobs are candidates until the user confirms import. Backend owns
all OpenAI calls, and the frontend never receives OpenAI credentials.

First CV generation output is an editable in-app draft. PDF/DOCX export
comes later.

## Paid AI Model

Paid AI is introduced after authentication and user-owned data exist.

- Stripe test mode is the billing provider.
- Each signed-in user gets 10 one-time free AI credits.
- Each successful AI operation consumes 1 credit.
- Validation failures and failed OpenAI/provider calls do not consume
  credits.
- After credits are exhausted, unpaid users receive
  `402 AI_PAYMENT_REQUIRED`.
- Active paid subscriptions unlock AI usage after the free credits are
  exhausted.
- Backend owns all enforcement and all OpenAI calls.
- The frontend shows remaining credits, paid state, and upgrade actions.

## Deferred Ideas

pgvector, embeddings, job chunks, and RAG over saved job content are
deferred. They may become useful later, but they are not part of the
active execution backlog because the cohesive product needs discovery,
deduplication, profile matching, application materials, and paid AI
controls first.

## Delivery Order

1. Complete backend persistence and frontend API integration.
2. Add non-AI product workflows: Kanban, contacts, reminders, documents,
   calendar, profile, saved searches, import review, and duplicate
   warnings.
3. Add authentication, user-owned data, and paid AI foundation.
4. Integrate paid AI into discovery, profile parsing, job fit, CV drafts,
   and application materials.
5. Finish with deployment, screenshots, architecture docs, demo data, and
   production polish.
