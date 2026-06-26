# Task 039 - Add Prompt Templates For Analysis Ask And Task Generation

## Instructions

Read `../AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Keep AI prompts organized and reusable for analysis, follow-up
questions, and task generation.

## Scope

In scope:

- Review existing prompt factory code.
- Add missing task-generation prompt support.
- Keep prompt inputs typed and testable.

Out of scope:

- RAG prompts.
- Prompt experimentation unrelated to current features.
- Logging raw prompts.

## Required Changes

- Extend existing prompt structure rather than adding a parallel system.
- Add tests for generated prompt content boundaries.
- Avoid embedding secrets or user-specific private values.

## Tests

- Analysis prompt still produces expected instruction shape.
- Ask prompt still includes needed context.
- Task-generation prompt is covered.

## Validation

Run `npm run backend:verify`.

## Acceptance Criteria

- [ ] Prompt templates are centralized.
- [ ] Task generation has prompt support.
- [ ] Prompt tests cover key behavior.

## Commit

```text
task-039: add prompt templates for analysis ask and task generation
```
