# Phase 5: AI Features

Goal: make AI part of the saved job workflow.

## Tasks

- [ ] Analyze a saved job description.
- [ ] Display saved AI analysis in the job AI tab.
- [ ] Ask AI a question about a saved job.
- [ ] Display AI answer below the ask input.
- [ ] Save AI answer as a note.
- [ ] Generate preparation tasks from a job description.
- [ ] Let user select generated tasks before saving.
- [ ] Cache AI outputs per job.
- [ ] Add prompt templates for analysis, ask, and task generation.
- [ ] Add structured response parsing and validation.
- [ ] Add AI endpoint error handling.
- [ ] Add basic AI request logging without sensitive raw content.
- [ ] Add rate limiting for AI endpoints.
- [ ] Add pgvector migration.
- [ ] Add job chunk table.
- [ ] Add job description chunking.
- [ ] Add embeddings generation.
- [ ] Add RAG ask endpoint over job description and notes.
- [ ] Return sources for RAG answers.

## Acceptance Criteria

- AI works from a saved job detail page.
- AI outputs can be reused instead of regenerated every time.
- Generated tasks and answers can become real tracker data.
- RAG answers include source previews.
