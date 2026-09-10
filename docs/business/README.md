# Business Planning

This folder is for product and feature planning documents.

Use it for:

- feature behavior decisions
- user workflow plans
- domain model notes
- acceptance criteria that are larger than one implementation task
- future Smart Job Tracker product ideas

Current source-of-truth context lives in:

- [`../context.md`](../context.md)
- [`../backlog/README.md`](../backlog/README.md)
- [`../../tasks`](../../tasks)

When a backlog item becomes large or needs product detail, create a
focused plan in this folder and link it from the relevant numbered task.

## Plans

- [Final Smart Job Tracker roadmap](./final-smart-job-tracker-roadmap.md)
- [End-to-end testing strategy](./e2e-testing-strategy-plan.md)
- [Task 001 - Add PostgreSQL Docker Service Plan](./postgresql-docker-service-plan.md)
- [Task 002 - Add Flyway Migration Setup Plan](./002-flyway-migration-setup-plan.md)
- [Task 003 - Create Job Entity Plan](./003-create-job-entity-plan.md)
- [Task 004 - Create Job Repository Plan](./004-create-job-repository-plan.md)
- [Task 005 - Create Job Service Plan](./005-create-job-service-plan.md)
- [Task 006 - Create Job Controller Plan](./006-create-job-controller-plan.md)
- [Task 007 - Add Job CRUD Endpoints Plan](./007-add-job-crud-endpoints-plan.md)
- [Task 008 - Create Task Entity Plan](./008-create-task-entity-plan.md)
- [Task 009 - Create Task Repository Plan](./009-create-task-repository-plan.md)
- [Task 069 - Add Docker Compose For Full Local Stack Plan](./069-add-docker-compose-for-full-local-stack-plan.md)
- [Task 077 - Make Backend Scripts Cross-Platform Plan](./077-make-backend-scripts-cross-platform-plan.md)
- [Task 078 - Add Testcontainers PostgreSQL Tests Plan](./078-add-testcontainers-postgres-tests-plan.md)
- [Task 079 - Run The API Collection In CI Plan](./079-run-api-collection-in-ci-plan.md)

## Bug Plans

Defect fixes that needed a decision recorded before implementation.
Bug numbering is its own sequence; see
[`../../tasks/bugs/README.md`](../../tasks/bugs/README.md).

- [Bug 001 - Assigned-Id Entities Merge On Save Plan](./bug-001-assigned-id-entities-merge-on-save-plan.md)
