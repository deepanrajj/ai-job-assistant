# Task 046 - Add RAG Ask Endpoint Over Job Description And Notes

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Answer user questions using retrieved job description and note context.

## Scope

In scope:

- Add a backend RAG ask endpoint for one saved job.
- Retrieve relevant chunks and notes.
- Call the AI provider with retrieved context.

Out of scope:

- Frontend integration.
- Returning rich source previews if deferred to Task 047.
- Cross-job search.

## Required Changes

- Define request/response DTOs.
- Add retrieval and prompt assembly service behavior.
- Keep raw provider details behind backend services.

## Tests

- Endpoint validates requests.
- Retrieval results are included in provider context.
- Missing job and provider failure errors are handled.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] RAG ask endpoint exists for saved jobs.
- [ ] Retrieved job context is used.
- [ ] Tests cover success and error paths.

## Commit

```text
task-046: add rag ask endpoint over job description and notes
```
