# Task 054 - Add Architecture Diagram To README

## Instructions

Read `../AGENTS.md`, `../docs/context.md`, `../docs/architecture.md`,
and `../README.md` before starting.

## Goal

Add a concise architecture diagram to the root README.

## Scope

In scope:

- Reuse or summarize the existing architecture docs.
- Show frontend, backend, AI provider, local Kubernetes, and planned
  database clearly.

Out of scope:

- Replacing detailed architecture docs.
- Adding diagrams that conflict with `docs/context.md`.

## Required Changes

- Add a compact Mermaid diagram or linked image to README.
- Keep details in `docs/architecture.md`.

## Tests

- No unit tests required.
- Manually verify README renders the diagram correctly.

## Validation

Run `npm run verify` only if code changed.

## Acceptance Criteria

- [ ] README includes a clear architecture diagram.
- [ ] Diagram matches current docs.
- [ ] Detailed docs remain linked.

## Commit

```text
task-054: add architecture diagram to readme
```
