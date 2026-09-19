package com.smartjobtracker.tasks

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.tasks.command.CreateTaskCommand
import com.smartjobtracker.tasks.command.UpdateTaskCommand
import com.smartjobtracker.testsupport.api.assertApiException
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import com.smartjobtracker.testsupport.tasks.taskFixtureDueDate
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@SpringBootTest
@Transactional
class TaskServiceTest {
    @Autowired
    lateinit var taskRepository: TaskRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var jobService: JobService

    private val fixedClock: Clock = Clock.fixed(Instant.parse("2026-07-05T12:00:00Z"), ZoneOffset.UTC)

    private val expectedNow: OffsetDateTime = OffsetDateTime.now(fixedClock)

    private lateinit var taskService: TaskService

    @BeforeEach
    fun setUp() {
        taskService = DefaultTaskService(taskRepository, jobService, fixedClock)
    }

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun seedTask(
        jobId: UUID,
        title: String = "Seeded task",
        createdAt: OffsetDateTime = expectedNow.minusDays(1),
    ): Task =
        taskRepository.save(
            createTaskEntity(jobId = jobId, title = title, createdAt = createdAt, updatedAt = createdAt),
        )

    @Test
    fun `lists a job's tasks in creation order`() {
        val jobId = seedJob()
        seedTask(jobId, title = "Newer", createdAt = expectedNow.minusDays(1))
        seedTask(jobId, title = "Older", createdAt = expectedNow.minusDays(2))
        seedTask(seedJob(), title = "Other job")

        val titles = taskService.listTasks(jobId).map { it.title }

        assertThat(titles).containsExactly("Older", "Newer")
    }

    @Test
    fun `throws job not found when listing tasks for a missing job`() {
        val exception = catchThrowableOfType(ApiException::class.java) { taskService.listTasks(UUID.randomUUID()) }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `creates a task with defaults from a minimal command`() {
        val jobId = seedJob()

        val created = taskService.createTask(jobId, CreateTaskCommand(title = "Prepare portfolio"))

        assertThat(created.jobId).isEqualTo(jobId)
        assertThat(created.title).isEqualTo("Prepare portfolio")
        assertThat(created.status).isEqualTo(TaskStatus.TODO)
        assertThat(created.dueDate).isNull()
        assertThat(created.createdAt).isEqualTo(expectedNow)
        assertThat(created.updatedAt).isEqualTo(expectedNow)
        assertThat(taskRepository.existsById(created.id)).isTrue()
    }

    @Test
    fun `creates a task with status and due date from a full command`() {
        val jobId = seedJob()

        val created =
            taskService.createTask(
                jobId,
                CreateTaskCommand(title = "Mock interview", status = TaskStatus.DONE, dueDate = taskFixtureDueDate),
            )

        assertThat(created.status).isEqualTo(TaskStatus.DONE)
        assertThat(created.dueDate).isEqualTo(taskFixtureDueDate)
    }

    @Test
    fun `throws job not found when creating a task for a missing job`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.createTask(UUID.randomUUID(), CreateTaskCommand(title = "Prepare portfolio"))
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `updates title, status, and due date, and refreshes updatedAt`() {
        val jobId = seedJob()
        val seeded = seedTask(jobId)

        val updated =
            taskService.updateTask(
                jobId,
                seeded.id,
                UpdateTaskCommand(title = "Updated title", status = TaskStatus.DONE, dueDate = taskFixtureDueDate),
            )

        assertThat(updated.id).isEqualTo(seeded.id)
        assertThat(updated.jobId).isEqualTo(jobId)
        assertThat(updated.createdAt).isEqualTo(seeded.createdAt)
        assertThat(updated.title).isEqualTo("Updated title")
        assertThat(updated.status).isEqualTo(TaskStatus.DONE)
        assertThat(updated.dueDate).isEqualTo(taskFixtureDueDate)
        assertThat(updated.updatedAt).isEqualTo(expectedNow)
    }

    @Test
    fun `clears the due date when the update command's due date is null`() {
        val jobId = seedJob()
        val seeded = seedTask(jobId)

        val updated =
            taskService.updateTask(
                jobId,
                seeded.id,
                UpdateTaskCommand(title = seeded.title, status = seeded.status, dueDate = null),
            )

        assertThat(updated.dueDate).isNull()
    }

    @Test
    fun `throws job not found when updating a task under a missing job`() {
        val jobId = seedJob()
        val seeded = seedTask(jobId)
        val command = UpdateTaskCommand(title = "Updated", status = TaskStatus.DONE, dueDate = null)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.updateTask(UUID.randomUUID(), seeded.id, command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws task not found when updating a missing task`() {
        val jobId = seedJob()
        val command = UpdateTaskCommand(title = "Updated", status = TaskStatus.DONE, dueDate = null)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.updateTask(jobId, UUID.randomUUID(), command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.TASK_NOT_FOUND,
            message = "Task not found.",
        )
    }

    @Test
    fun `throws task not found and leaves it unchanged when updating a task under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedTask(otherJobId, title = "Untouched")
        val command = UpdateTaskCommand(title = "Hijacked", status = TaskStatus.DONE, dueDate = null)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.updateTask(ownJobId, seeded.id, command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.TASK_NOT_FOUND,
            message = "Task not found.",
        )
        val stillSeeded = taskRepository.findById(seeded.id).orElseThrow()
        assertThat(stillSeeded.title).isEqualTo("Untouched")
    }

    @Test
    fun `deletes a task`() {
        val jobId = seedJob()
        val seeded = seedTask(jobId)

        taskService.deleteTask(jobId, seeded.id)

        assertThat(taskRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `throws job not found when deleting a task under a missing job`() {
        val jobId = seedJob()
        val seeded = seedTask(jobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.deleteTask(UUID.randomUUID(), seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws task not found when deleting a missing task`() {
        val jobId = seedJob()

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.deleteTask(jobId, UUID.randomUUID())
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.TASK_NOT_FOUND,
            message = "Task not found.",
        )
    }

    @Test
    fun `throws task not found and keeps it when deleting a task under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedTask(otherJobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                taskService.deleteTask(ownJobId, seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.TASK_NOT_FOUND,
            message = "Task not found.",
        )
        assertThat(taskRepository.existsById(seeded.id)).isTrue()
    }
}
