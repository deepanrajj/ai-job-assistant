# Phase 3: Backend Foundation

Goal: create the Spring Boot Kotlin backend for persisted tracker data.

## Tasks

- [ ] [Add PostgreSQL docker service](../../tasks/001-add-postgresql-docker-service.md).
- [ ] [Add Flyway migration setup](../../tasks/002-add-flyway-migration-setup.md).
- [x] Add global exception handling.
- [x] Add request validation.
- [ ] [Create job entity](../../tasks/003-create-job-entity.md).
- [ ] [Create job repository](../../tasks/004-create-job-repository.md).
- [ ] [Create job service](../../tasks/005-create-job-service.md).
- [ ] [Create job controller](../../tasks/006-create-job-controller.md).
- [ ] [Add job CRUD endpoints](../../tasks/007-add-job-crud-endpoints.md).
- [ ] [Create task entity](../../tasks/008-create-task-entity.md).
- [ ] [Create task repository](../../tasks/009-create-task-repository.md).
- [ ] [Create task service](../../tasks/010-create-task-service.md).
- [ ] [Create task controller](../../tasks/011-create-task-controller.md).
- [ ] [Add task CRUD endpoints](../../tasks/012-add-task-crud-endpoints.md).
- [ ] [Create note entity](../../tasks/013-create-note-entity.md).
- [ ] [Create note repository](../../tasks/014-create-note-repository.md).
- [ ] [Create note service](../../tasks/015-create-note-service.md).
- [ ] [Create note controller](../../tasks/016-create-note-controller.md).
- [ ] [Add note CRUD endpoints](../../tasks/017-add-note-crud-endpoints.md).
- [ ] [Create timeline event entity](../../tasks/018-create-timeline-event-entity.md).
- [ ] [Track timeline events when job status changes](../../tasks/019-track-timeline-events-when-job-status-changes.md).
- [x] Add OpenAPI or Swagger documentation.

## Acceptance Criteria

- Backend starts locally with PostgreSQL.
- Job, task, note, and timeline data persist in the database.
- API errors return consistent JSON responses.
- Core endpoints are discoverable through Swagger/OpenAPI.
