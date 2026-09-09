# Phase 8: Portfolio And Production Polish

Goal: make the project presentable for GitHub, interviews, and deployment.

## Tasks

- [ ] [Add backend integration tests](../../tasks/roadmap/068-add-backend-integration-tests.md).
- [ ] [Add docker-compose for full local stack](../../tasks/roadmap/069-add-docker-compose-for-full-local-stack.md).
- [ ] [Add seed demo data](../../tasks/roadmap/070-add-seed-demo-data.md).
- [ ] [Add screenshots to README](../../tasks/roadmap/071-add-screenshots-to-readme.md).
- [ ] [Add architecture diagram to README](../../tasks/roadmap/072-add-architecture-diagram-to-readme.md).
- [ ] [Add AI and billing features section to README](../../tasks/roadmap/073-add-ai-and-billing-features-section-to-readme.md).
- [ ] [Add deployment notes](../../tasks/roadmap/074-add-deployment-notes.md).
- [ ] [Deploy frontend](../../tasks/roadmap/075-deploy-frontend.md).
- [ ] [Deploy backend](../../tasks/roadmap/076-deploy-backend.md).
- [x] [Make backend scripts cross-platform](../../tasks/roadmap/077-make-backend-scripts-cross-platform.md).
- [x] [Add Testcontainers PostgreSQL tests](../../tasks/roadmap/078-add-testcontainers-postgres-tests.md).
- [ ] [Run the API collection in CI](../../tasks/roadmap/079-run-api-collection-in-ci.md).
- [ ] [Add Playwright harness and first journey](../../tasks/roadmap/080-add-playwright-harness-and-first-journey.md).
- [ ] [Expand browser journey coverage](../../tasks/roadmap/081-expand-browser-journey-coverage.md).

Tasks 077 to 081 are numbered into this phase because testing
infrastructure belongs with task 068, but they are **not** meant to run
last. Tasks 077, 078, 079 and 069 have no dependency on any unfinished
feature work and are worth doing early; 080 and 081 unlock once task
026 connects the add-job form to the backend. See
[the end-to-end testing strategy](../business/e2e-testing-strategy-plan.md)
for the intended ordering.

## Acceptance Criteria

- A new developer can run the project from the README.
- The app has demo data for screenshots and walkthroughs.
- The GitHub repository clearly communicates the product, stack, AI
  features, and paid-after-free-tries model.
- The deployed app is suitable to share in applications or interviews.
