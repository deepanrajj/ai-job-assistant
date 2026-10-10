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

- [ ] [Task 040: Add reminders](../../tasks/roadmap/040-add-reminders.md),
  backend steps 1-6.
- [ ] [Task 041: Add application documents](../../tasks/roadmap/041-add-application-documents.md),
  backend steps 1-6; its frontend is behind `DOCUMENTS_FEATURE_ENABLED`.
- [ ] [Task 042: Add calendar view](../../tasks/roadmap/042-add-calendar-view.md),
  backend `GET /api/calendar-items` after 040's and 041's; its frontend
  is behind `CALENDAR_FEATURE_ENABLED`.
- [ ] [Task 044: Add profile and resume library](../../tasks/roadmap/044-add-profile-resume-library.md),
  backend `/api/resume-profiles`; its frontend is behind
  `PROFILES_FEATURE_ENABLED`.
- [ ] [Task 045: Add skills inventory and job preferences](../../tasks/roadmap/045-add-skills-inventory-and-preferences.md),
  backend `/api/profile/preferences`; its frontend is behind
  `PREFERENCES_FEATURE_ENABLED`.
- [ ] [Task 046: Add Discover saved searches](../../tasks/roadmap/046-add-discover-saved-searches.md),
  backend `/api/saved-searches`; its frontend is behind
  `SAVED_SEARCHES_FEATURE_ENABLED`.
- [ ] [Task 047: Add import candidate review workflow](../../tasks/roadmap/047-add-import-candidate-review-workflow.md),
  backend `/api/import-candidates`; its frontend is behind
  `IMPORT_CANDIDATES_FEATURE_ENABLED`.
- [ ] [Task 048: Add import duplicate detection](../../tasks/roadmap/048-add-import-duplicate-detection.md),
  the next frontend task.

Task 040's frontend is on `main` behind `REMINDERS_FEATURE_ENABLED`,
with a dev-server mock; its backend, then the removal of the mock and
the flag, completes it. Task 043 added dashboard insights computed from
recorded status history: applications this week, interview rate,
applications waiting for a reply, and an explained unavailable response
rate. Its next actions are 040's reminders card, so they appear in
built images once 040's backend lands.
