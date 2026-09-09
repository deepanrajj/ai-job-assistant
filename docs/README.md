# Smart Job Tracker Docs

This folder keeps the project plan close to the code so it can be reviewed in
GitHub together with implementation changes.

## Contents

- [Authoritative Context](./context.md)
- [Setup](./setup.md)
- [Architecture](./architecture.md)
- [Infrastructure](./infrastructure.md)
- [Swagger Setup](./swagger.md)
- [API Requests](./api/README.md)
- [Business Planning](./business/README.md)
- [Engineering Notes](./engineering/README.md)
- [Backlog Overview](./backlog/README.md)

## How We Use This

- Keep product and engineering decisions in Markdown.
- Keep current project context in `docs/context.md`.
- `docs/context.md` describes what exists. Rules an implementer must
  follow go in the relevant `AGENTS.md` instead, where someone editing
  that code will actually read them. When a change produces both, split
  it: the shared entity base is named in `context.md` section 3, while
  the rules about extending it live in `backend/AGENTS.md` section 4.
- Track implementation work with GitHub task lists.
- Update checkboxes in the same pull request that completes the work.
- Split large backlog items into smaller tasks before implementation.
