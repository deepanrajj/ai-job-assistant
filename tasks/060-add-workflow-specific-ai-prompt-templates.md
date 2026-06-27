# Task 060 - Add Workflow Specific AI Prompt Templates

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Make prompts explicit and workflow-specific for paid AI features.

## Scope

In scope:

- Create templates for analysis, ask, discovery, profile extraction, fit ranking, CV draft, and application materials.
- Keep templates backend-owned.
- Keep outputs structured where the UI depends on fields.

Out of scope:

- Prompt editing UI.
- User-authored prompt templates.
- RAG/vector retrieval.

## Required Changes

- Refactor prompt creation by AI operation.
- Add tests for prompt selection and schema usage.
- Avoid logging raw prompt content in production paths.

## Tests

- Each AI operation uses the expected template.
- Structured response schema matches the operation.
- Prompt tests do not require OpenAI network access.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Workflow prompts are explicit.
- [ ] AI operations have clear schemas.
- [ ] Tests cover prompt factory behavior.

## Commit

```text
task-060: add workflow specific ai prompt templates
```
