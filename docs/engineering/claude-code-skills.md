# Claude Code Skills

The repository carries a few Claude Code skills under `.claude/skills/`.
This note records what they are for and which parts of `.claude/` are
tracked, because the split is not obvious from looking at the folder.

## What is tracked, and why

| Path | Tracked | Reason |
| --- | --- | --- |
| `.claude/skills/**` | yes | shared workflow knowledge; anyone who clones gets it |
| `.claude/settings.local.json` | no | per-machine tool permissions, meaningless to anyone else |

`.gitignore` excludes only the settings file. A skill is documentation
that happens to be machine-readable, so it belongs in the repository for
the same reason `docs/` does.

## The skills

**`start-task`** covers the workflow the repository already follows:
sync `main`, branch by the naming convention, write a plan under
`docs/business/` before code, implement, verify, then update the task
file, backlog, and plan. It records two things that are easy to get
wrong here: backend work is taught step by step rather than written
outright, and a bug fix's regression test must be seen failing before
the fix, as `tasks/bugs/README.md` requires.

**`start-local`** and **`stop-local`** cover the local Kubernetes
runtime. `npm run dev` already does the work; the skills exist for the
parts that are not visible in `package.json` - why `k8s:namespace` runs
before `k8s:apply` even though the kustomization creates the namespace,
why `k8s:load-images` is mandatory rather than an optimisation, and why
`npm run k8s:delete` is more destructive than it looks.

## Keep them corrected by use

`start-local` was written from reading `package.json`, the manifests,
and `docs/setup.md`. Running it for the first time immediately found
three things it had wrong or omitted:

- it assumed Kubernetes was enabled, and could not recognise
  `current-context is not set`
- it treated any backend pod restart as a crash loop, when one or two
  on a cold cluster are the retry mechanism, there being no startup
  ordering between the backend and PostgreSQL
- it verified with `ai/health`, which never touches the database, so a
  stack with a dead PostgreSQL would have passed

All three are now in the skill. The lesson is that a runbook written
from documentation is a draft: add the failure mode the first time you
hit it, and the file compounds instead of rotting.

## Adding one

Create `.claude/skills/<name>/SKILL.md` with `name` and `description`
frontmatter. The `description` is the whole trigger mechanism, so write
it as the phrases someone would actually say, not as a summary of the
body.

Skills that are personal rather than shared belong in `~/.claude/skills/`
instead, where they follow the author across projects rather than the
project across authors.
