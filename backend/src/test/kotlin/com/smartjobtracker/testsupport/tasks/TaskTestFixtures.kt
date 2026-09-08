package com.smartjobtracker.testsupport.tasks

import com.smartjobtracker.tasks.Task
import com.smartjobtracker.tasks.TaskStatus
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

internal val taskFixtureTimestamp: OffsetDateTime = OffsetDateTime.parse("2026-07-05T12:00:00Z")

internal val taskFixtureDueDate: LocalDate = LocalDate.parse("2026-08-25")

/**
 * Builds a task for tests. `jobId` has no default because there is no
 * sensible default job to point at; each caller passes the id it wants,
 * including an unsaved one when the test is about the foreign key.
 */
fun createTaskEntity(
    jobId: UUID,
    id: UUID = UUID.randomUUID(),
    title: String = "Prepare system design answers",
    status: TaskStatus = TaskStatus.TODO,
    dueDate: LocalDate? = taskFixtureDueDate,
    createdAt: OffsetDateTime = taskFixtureTimestamp,
    updatedAt: OffsetDateTime = taskFixtureTimestamp,
): Task =
    Task(
        id = id,
        jobId = jobId,
        title = title,
        status = status,
        dueDate = dueDate,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
