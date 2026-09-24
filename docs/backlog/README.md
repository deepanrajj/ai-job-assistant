# Backlog Overview

This backlog is organized by project phase. GitHub renders the
checkboxes, so progress is visible directly in the repository.

## Phases

- [Phase 1: Frontend Foundation](./phase-1-frontend-foundation.md)
- [Phase 2: Job Tracker Frontend MVP](./phase-2-job-tracker-frontend-mvp.md)
- [Phase 3: Backend Foundation](./phase-3-backend-foundation.md)
- [Phase 4: Frontend Backend Integration](./phase-4-frontend-backend-integration.md)
- [Phase 5: Core And Advanced Non-AI Workflows](./phase-5-non-ai-workflows.md)
- [Phase 6: Authentication And AI Billing Foundation](./phase-6-authentication-and-ai-billing.md)
- [Phase 7: Integrated Paid AI Workflows](./phase-7-integrated-paid-ai-workflows.md)
- [Phase 8: Portfolio And Production Polish](./phase-8-portfolio-polish.md)

## Backlog Rules

Product refinements, dependencies, and recommendations beyond the numbered
backlog are tracked in the
[product improvements plan](../business/product-improvements-and-recommendations-plan.md).
Its recommendation IDs are planning references; promote each to a scoped
numbered task before implementation.

- Keep each task small enough to complete in one focused change.
- Mark a task as complete only when it is implemented and verified.
- Add a short note under a task if the scope changes.
- Prefer updating this backlog in the same branch as the implementation.
- When a task becomes too large, split it into smaller tasks.
- Use numbered task files in `../../tasks/` as execution-ready work
  units.
- Use `../../templates/task-template.md` for new task files.

## Suggested GitHub Workflow

1. Pick the next unchecked task.
2. Create a branch, for example `codex/job-detail-page`.
3. Implement the task.
4. Update the checkbox in this folder.
5. Push the branch and open a pull request.

## Current Recommended Next Task

- [ ] [Task 039: Add job contacts](../../tasks/roadmap/039-add-job-contacts.md).

Task 038 added an optional source to saved jobs (LinkedIn, Indeed,
Xing, company website, AI search, referral, or other): a nullable
`jobs.source` column, a select on the add/edit job form, and a Source
item on the job detail header. Jobs saved before it keep an empty
source and show "Not set". Task 039 continues building out the Jobs
section with job contacts.
