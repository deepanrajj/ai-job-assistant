# Task <ID> - <Short, Explicit Title>

## Instructions

Read these files before starting:

- `../AGENTS.md`
- `../docs/context.md`
- `<app-specific AGENTS.md when editing frontend or backend>`

Follow `AGENTS.md` exactly. Implement this task only. Do not expand
scope beyond this file.

## Context

This task exists because:

- `<why this task is needed>`

Related docs:

- `<link to backlog phase, business plan, or engineering note>`

## Goal

After this task:

- `<concrete outcome 1>`
- `<concrete outcome 2>`
- `<concrete outcome 3>`

## Scope

In scope:

- `<specific area or behavior>`

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries unless explicitly listed.
- No behavior outside this task.

## Pre-Execution

Before changing files:

1. Identify relevant files.
2. Describe current behavior.
3. Describe intended behavior.
4. List assumptions.

Stop and ask if product or architecture intent is unclear.

## Required Changes

Implementation boundaries:

- Reuse existing naming, structure, and patterns.
- Keep changes minimal.
- Update docs only when documented behavior changes.

Steps:

1. `<precise change>`
2. `<precise change>`
3. `<precise change>`

## Data And Contracts

If applicable, specify:

- API request/response changes.
- database tables/columns.
- localStorage keys.
- environment variables.
- integration boundaries.

## Tests

Required test coverage:

- `<unit test scenario>`
- `<component/controller/integration scenario>`

Rules:

- Use existing test infrastructure.
- Do not skip tests.
- Do not weaken assertions.
- Tests should verify behavior, not implementation details.

## Validation

Run the relevant checks:

```bash
npm run frontend:verify
npm run backend:verify
npm run verify
```

Choose the narrowest check while iterating and the appropriate final
check before completion.

## Acceptance Criteria

- [ ] Goal behavior works.
- [ ] Relevant tests are added or updated.
- [ ] Required verification passes.
- [ ] No unrelated files are changed.
- [ ] No secrets or generated artifacts are committed.
- [ ] Code follows `AGENTS.md` and app-specific instructions.

## Commit

```text
task-<ID>: <summary>
```
