package com.smartjobtracker.tasks

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.tasks.command.CreateTaskCommand
import com.smartjobtracker.tasks.command.UpdateTaskCommand
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.OffsetDateTime
import java.util.UUID

interface TaskService {
    fun listTasks(jobId: UUID): List<Task>

    fun createTask(
        jobId: UUID,
        command: CreateTaskCommand,
    ): Task

    fun updateTask(
        jobId: UUID,
        taskId: UUID,
        command: UpdateTaskCommand,
    ): Task

    fun deleteTask(
        jobId: UUID,
        taskId: UUID,
    )
}

@Service
class DefaultTaskService(
    private val taskRepository: TaskRepository,
    private val jobService: JobService,
    private val clock: Clock,
) : TaskService {
    @Transactional
    override fun listTasks(jobId: UUID): List<Task> {
        jobService.getJob(jobId)

        return taskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)
    }

    @Transactional
    override fun createTask(
        jobId: UUID,
        command: CreateTaskCommand,
    ): Task {
        jobService.getJob(jobId)
        val timestamp = now()
        val task =
            Task(
                id = UUID.randomUUID(),
                jobId = jobId,
                title = command.title,
                status = command.status,
                dueDate = command.dueDate,
                createdAt = timestamp,
                updatedAt = timestamp,
            )

        return taskRepository.save(task)
    }

    /**
     * Mutates the managed instance rather than rebuilding it. Hibernate's
     * dirty checking writes the `UPDATE` when the transaction commits, so
     * no `save` call is needed. See `DefaultJobService.updateJob`.
     */
    @Transactional
    override fun updateTask(
        jobId: UUID,
        taskId: UUID,
        command: UpdateTaskCommand,
    ): Task {
        jobService.getJob(jobId)
        val task = taskRepository.findByIdAndJobId(id = taskId, jobId = jobId) ?: throw taskNotFound()
        task.title = command.title
        task.status = command.status
        task.dueDate = command.dueDate
        task.updatedAt = now()

        return task
    }

    @Transactional
    override fun deleteTask(
        jobId: UUID,
        taskId: UUID,
    ) {
        jobService.getJob(jobId)
        val task = taskRepository.findByIdAndJobId(id = taskId, jobId = jobId) ?: throw taskNotFound()
        taskRepository.delete(task)
    }

    private fun now(): OffsetDateTime = OffsetDateTime.now(clock)

    private fun taskNotFound(): ApiException =
        ApiException(
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.TASK_NOT_FOUND,
            message = "Task not found.",
        )
}
