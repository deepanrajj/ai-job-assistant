package com.smartjobtracker.testsupport.tasks

import com.smartjobtracker.tasks.Task
import com.smartjobtracker.tasks.TaskService
import com.smartjobtracker.tasks.TaskStatus
import com.smartjobtracker.tasks.command.CreateTaskCommand
import com.smartjobtracker.tasks.command.UpdateTaskCommand
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

class FakeTaskService : TaskService {
    lateinit var lastListedJobId: UUID
    lateinit var lastCreateJobId: UUID
    lateinit var lastCreateCommand: CreateTaskCommand
    lateinit var lastUpdateJobId: UUID
    lateinit var lastUpdateTaskId: UUID
    lateinit var lastUpdateCommand: UpdateTaskCommand
    lateinit var lastDeleteJobId: UUID
    lateinit var lastDeleteTaskId: UUID

    var listHandler: (UUID) -> List<Task> = { jobId -> listOf(createTaskEntity(jobId = jobId)) }

    var createHandler: (UUID, CreateTaskCommand) -> Task = { jobId, _ -> createTaskEntity(jobId = jobId) }

    var updateHandler: (UUID, UUID, UpdateTaskCommand) -> Task =
        { jobId, taskId, _ -> createTaskEntity(jobId = jobId, id = taskId) }

    var deleteHandler: (UUID, UUID) -> Unit = { _, _ -> }

    override fun listTasks(jobId: UUID): List<Task> {
        lastListedJobId = jobId

        return listHandler(jobId)
    }

    override fun createTask(
        jobId: UUID,
        command: CreateTaskCommand,
    ): Task {
        lastCreateJobId = jobId
        lastCreateCommand = command

        return createHandler(jobId, command)
    }

    override fun updateTask(
        jobId: UUID,
        taskId: UUID,
        command: UpdateTaskCommand,
    ): Task {
        lastUpdateJobId = jobId
        lastUpdateTaskId = taskId
        lastUpdateCommand = command

        return updateHandler(jobId, taskId, command)
    }

    override fun deleteTask(
        jobId: UUID,
        taskId: UUID,
    ) {
        lastDeleteJobId = jobId
        lastDeleteTaskId = taskId
        deleteHandler(jobId, taskId)
    }
}
