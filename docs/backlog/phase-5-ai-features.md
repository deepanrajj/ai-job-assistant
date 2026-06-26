# Phase 5: AI Features

Goal: make AI part of the saved job workflow.

## Tasks

- [x] Analyze a saved job description.
- [x] Display saved AI analysis in the job AI tab.
- [x] Ask AI a question about a saved job.
- [x] Display AI answer below the ask input.
- [ ] [Save AI answer as a note](../../tasks/036-save-ai-answer-as-note.md).
- [x] Generate preparation tasks from a job description.
- [ ] [Let user select generated tasks before saving](../../tasks/037-let-user-select-generated-tasks-before-saving.md).
- [ ] [Cache AI outputs per job](../../tasks/038-cache-ai-outputs-per-job.md).
- [ ] [Add prompt templates for analysis, ask, and task generation](../../tasks/039-add-prompt-templates-for-analysis-ask-and-task-generation.md).
- [x] Add structured response parsing and validation.
- [x] Add AI endpoint error handling.
- [ ] [Add basic AI request logging without sensitive raw content](../../tasks/040-add-basic-ai-request-logging-without-sensitive-raw-content.md).
- [ ] [Add rate limiting for AI endpoints](../../tasks/041-add-rate-limiting-for-ai-endpoints.md).
- [ ] [Add pgvector migration](../../tasks/042-add-pgvector-migration.md).
- [ ] [Add job chunk table](../../tasks/043-add-job-chunk-table.md).
- [ ] [Add job description chunking](../../tasks/044-add-job-description-chunking.md).
- [ ] [Add embeddings generation](../../tasks/045-add-embeddings-generation.md).
- [ ] [Add RAG ask endpoint over job description and notes](../../tasks/046-add-rag-ask-endpoint-over-job-description-and-notes.md).
- [ ] [Return sources for RAG answers](../../tasks/047-return-sources-for-rag-answers.md).

## Acceptance Criteria

- AI works from a saved job detail page.
- AI outputs can be reused instead of regenerated every time.
- Generated tasks and answers can become real tracker data.
- RAG answers include source previews.
