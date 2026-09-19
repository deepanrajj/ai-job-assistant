package com.smartjobtracker.tasks

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.api.error.ApiExceptionHandler
import com.smartjobtracker.testsupport.tasks.FakeTaskService
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import com.smartjobtracker.testsupport.tasks.taskFixtureDueDate
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import java.util.UUID

class TaskControllerTest {
    private lateinit var taskService: FakeTaskService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        taskService = FakeTaskService()
        mockMvc =
            MockMvcBuilders
                .standaloneSetup(TaskController(taskService))
                .setValidator(LocalValidatorFactoryBean().apply { afterPropertiesSet() })
                .setControllerAdvice(ApiExceptionHandler())
                .build()
    }

    @Test
    fun `lists tasks for a job`() {
        val jobId = UUID.randomUUID()
        val task = createTaskEntity(jobId = jobId, title = "Prepare portfolio")
        taskService.listHandler = { listOf(task) }

        mockMvc
            .perform(get("/jobs/{jobId}/tasks", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(task.id.toString()))
            .andExpect(jsonPath("$[0].title").value("Prepare portfolio"))
            .andExpect(jsonPath("$[0].jobId").doesNotExist())

        assertThat(taskService.lastListedJobId).isEqualTo(jobId)
    }

    @Test
    fun `creates a task and returns created`() {
        val jobId = UUID.randomUUID()
        val created = createTaskEntity(jobId = jobId, title = "Prepare portfolio", status = TaskStatus.DONE)
        taskService.createHandler = { _, _ -> created }

        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio", "status": "DONE"}"""),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.title").value("Prepare portfolio"))
            .andExpect(jsonPath("$.status").value("DONE"))

        assertThat(taskService.lastCreateJobId).isEqualTo(jobId)
        assertThat(taskService.lastCreateCommand.title).isEqualTo("Prepare portfolio")
        assertThat(taskService.lastCreateCommand.status).isEqualTo(TaskStatus.DONE)
    }

    @Test
    fun `creates a task without status using the todo default`() {
        val jobId = UUID.randomUUID()

        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio"}"""),
            ).andExpect(status().isCreated)

        assertThat(taskService.lastCreateCommand.status).isEqualTo(TaskStatus.TODO)
        assertThat(taskService.lastCreateCommand.dueDate).isNull()
    }

    @Test
    fun `updates a task, including clearing the due date`() {
        val jobId = UUID.randomUUID()
        val taskId = UUID.randomUUID()
        taskService.updateHandler = { jId, tId, _ -> createTaskEntity(jobId = jId, id = tId, title = "Updated") }

        mockMvc
            .perform(
                put("/jobs/{jobId}/tasks/{taskId}", jobId, taskId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Updated", "status": "DONE", "dueDate": null}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("Updated"))

        assertThat(taskService.lastUpdateJobId).isEqualTo(jobId)
        assertThat(taskService.lastUpdateTaskId).isEqualTo(taskId)
        assertThat(taskService.lastUpdateCommand.title).isEqualTo("Updated")
        assertThat(taskService.lastUpdateCommand.status).isEqualTo(TaskStatus.DONE)
        assertThat(taskService.lastUpdateCommand.dueDate).isNull()
    }

    @Test
    fun `deletes a task and returns no content`() {
        val jobId = UUID.randomUUID()
        val taskId = UUID.randomUUID()

        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", jobId, taskId))
            .andExpect(status().isNoContent)

        assertThat(taskService.lastDeleteJobId).isEqualTo(jobId)
        assertThat(taskService.lastDeleteTaskId).isEqualTo(taskId)
    }

    @Test
    fun `rejects a create request with a blank title`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("title"))
    }

    @Test
    fun `rejects a create request with a title longer than the column allows`() {
        val overlongTitle = "A".repeat(256)

        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "$overlongTitle"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("title"))
    }

    @Test
    fun `rejects an update request without a status`() {
        mockMvc
            .perform(
                put("/jobs/{jobId}/tasks/{taskId}", UUID.randomUUID(), UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Updated", "dueDate": "$taskFixtureDueDate"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("status"))
    }

    @Test
    fun `rejects a create request with an unknown status value`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio", "status": "NOT_A_STATUS"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
    }

    @Test
    fun `returns job not found when the service reports a missing job`() {
        taskService.listHandler = {
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.JOB_NOT_FOUND,
                message = "Job not found.",
            )
        }

        mockMvc
            .perform(get("/jobs/{jobId}/tasks", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns task not found when the service reports a missing task`() {
        taskService.deleteHandler = { _, _ ->
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.TASK_NOT_FOUND,
                message = "Task not found.",
            )
        }

        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", UUID.randomUUID(), UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))
    }

    @Test
    fun `returns bad request when the job id path segment is not a uuid`() {
        mockMvc
            .perform(get("/jobs/{jobId}/tasks", "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }

    @Test
    fun `returns bad request when the task id path segment is not a uuid`() {
        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", UUID.randomUUID(), "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }
}
