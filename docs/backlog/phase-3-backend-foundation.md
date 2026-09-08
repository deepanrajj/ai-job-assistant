# Phase 3: Backend Foundation

Goal: create the Spring Boot Kotlin backend for persisted tracker data.

## Tasks

- [x] [Add PostgreSQL docker service](../../tasks/roadmap/001-add-postgresql-docker-service.md).
- [x] [Add Flyway migration setup](../../tasks/roadmap/002-add-flyway-migration-setup.md).
- [x] Add global exception handling.
- [x] Add request validation.
- [x] [Create job entity](../../tasks/roadmap/003-create-job-entity.md).
- [x] [Create job repository](../../tasks/roadmap/004-create-job-repository.md).
- [x] [Create job service](../../tasks/roadmap/005-create-job-service.md).
- [x] [Create job controller](../../tasks/roadmap/006-create-job-controller.md).
- [x] [Add job CRUD endpoints](../../tasks/roadmap/007-add-job-crud-endpoints.md).
- [x] [Create task entity](../../tasks/roadmap/008-create-task-entity.md).
- [x] [Create task repository](../../tasks/roadmap/009-create-task-repository.md).
- [ ] [Create task service](../../tasks/roadmap/010-create-task-service.md).
- [ ] [Create task controller](../../tasks/roadmap/011-create-task-controller.md).
- [ ] [Add task CRUD endpoints](../../tasks/roadmap/012-add-task-crud-endpoints.md).
- [ ] [Create note entity](../../tasks/roadmap/013-create-note-entity.md).
- [ ] [Create note repository](../../tasks/roadmap/014-create-note-repository.md).
- [ ] [Create note service](../../tasks/roadmap/015-create-note-service.md).
- [ ] [Create note controller](../../tasks/roadmap/016-create-note-controller.md).
- [ ] [Add note CRUD endpoints](../../tasks/roadmap/017-add-note-crud-endpoints.md).
- [ ] [Create timeline event entity](../../tasks/roadmap/018-create-timeline-event-entity.md).
- [ ] [Track timeline events when job status changes](../../tasks/roadmap/019-track-timeline-events-when-job-status-changes.md).
- [x] Add OpenAPI or Swagger documentation.

## Acceptance Criteria

- Backend starts locally with PostgreSQL.
- Job, task, note, and timeline data persist in the database.
- API errors return consistent JSON responses.
- Core endpoints are discoverable through Swagger/OpenAPI.
