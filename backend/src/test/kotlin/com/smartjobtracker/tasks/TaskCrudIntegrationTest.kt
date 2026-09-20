package com.smartjobtracker.tasks

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.tasks.dto.TaskResponse
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import com.smartjobtracker.testsupport.tasks.taskFixtureDueDate
import com.smartjobtracker.testsupport.tasks.taskFixtureTimestamp
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.util.UUID

/**
 * End-to-end coverage of the task routes against the real application
 * context: the real controller, service, repository, Flyway-created
 * schema, and the application's own Jackson configuration.
 *
 * Branch-level cases stay in the isolated layer tests. This class
 * covers the seams those tests replace with fakes, mirroring
 * `JobCrudIntegrationTest`.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskCrudIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var taskRepository: TaskRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun postTask(
        jobId: UUID,
        body: String,
    ): TaskResponse {
        val responseBody =
            mockMvc
                .perform(
                    post("/jobs/{jobId}/tasks", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                ).andExpect(status().isCreated)
                .andReturn()
                .response
                .contentAsString

        return objectMapper.readValue(responseBody, TaskResponse::class.java)
    }

    @Test
    fun `creates a task over http and stores it in the database`() {
        val jobId = seedJob()

        val created = postTask(jobId, """{"title": "Prepare portfolio"}""")

        assertThat(created.title).isEqualTo("Prepare portfolio")
        assertThat(created.status).isEqualTo(TaskStatus.TODO)
        assertThat(created.createdAt).isEqualTo(created.updatedAt)

        val stored = taskRepository.findById(created.id)

        assertThat(stored).isPresent()
        assertThat(stored.get().jobId).isEqualTo(jobId)
        assertThat(stored.get().title).isEqualTo("Prepare portfolio")
    }

    @Test
    fun `lists tasks for a job in creation order`() {
        val jobId = seedJob()
        val newer =
            taskRepository.save(
                createTaskEntity(jobId = jobId, title = "Newer", createdAt = taskFixtureTimestamp.plusDays(1)),
            )
        val older =
            taskRepository.save(
                createTaskEntity(jobId = jobId, title = "Older", createdAt = taskFixtureTimestamp.minusDays(1)),
            )
        taskRepository.save(createTaskEntity(jobId = seedJob(), title = "Other job"))

        mockMvc
            .perform(get("/jobs/{jobId}/tasks", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(older.id.toString()))
            .andExpect(jsonPath("$[1].id").value(newer.id.toString()))
            .andExpect(jsonPath("$", hasSize<Any>(2)))
    }

    @Test
    fun `updates a task over http and preserves its creation time`() {
        val jobId = seedJob()
        val seeded = postTask(jobId, """{"title": "Old title", "status": "TODO", "dueDate": "$taskFixtureDueDate"}""")

        mockMvc
            .perform(
                put("/jobs/{jobId}/tasks/{taskId}", jobId, seeded.id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "New title", "status": "DONE", "dueDate": null}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("New title"))
            .andExpect(jsonPath("$.status").value("DONE"))
            .andExpect(jsonPath("$.dueDate").doesNotExist())

        val stored = taskRepository.findById(seeded.id).orElseThrow()

        assertThat(stored.title).isEqualTo("New title")
        assertThat(stored.status).isEqualTo(TaskStatus.DONE)
        assertThat(stored.dueDate).isNull()
        assertThat(stored.createdAt).isEqualTo(seeded.createdAt)
        assertThat(stored.updatedAt).isAfterOrEqualTo(seeded.updatedAt)
    }

    @Test
    fun `deletes a task over http and removes it from the database`() {
        val jobId = seedJob()
        val seeded = postTask(jobId, """{"title": "Prepare portfolio"}""")

        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", jobId, seeded.id))
            .andExpect(status().isNoContent)

        assertThat(taskRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `returns job not found for create update and delete under an unknown job`() {
        val unknownJobId = UUID.randomUUID()

        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", unknownJobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(
                put("/jobs/{jobId}/tasks/{taskId}", unknownJobId, UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio", "status": "TODO", "dueDate": null}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", unknownJobId, UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns task not found for update and delete of an unknown task under a real job`() {
        val jobId = seedJob()
        val unknownTaskId = UUID.randomUUID()

        mockMvc
            .perform(
                put("/jobs/{jobId}/tasks/{taskId}", jobId, unknownTaskId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": "Prepare portfolio", "status": "TODO", "dueDate": null}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/tasks/{taskId}", jobId, unknownTaskId))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))
    }

    @Test
    fun `returns a validation error through the real error handler`() {
        val jobId = seedJob()

        mockMvc
            .perform(
                post("/jobs/{jobId}/tasks", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"title": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("title"))
    }

    @Test
    fun `response body omits job id and serializes timestamps as iso instants`() {
        val jobId = seedJob()
        postTask(jobId, """{"title": "Prepare portfolio"}""")

        val responseBody =
            mockMvc
                .perform(get("/jobs/{jobId}/tasks", jobId))
                .andExpect(status().isOk)
                .andReturn()
                .response
                .contentAsString

        assertThat(responseBody).doesNotContain("jobId")
        assertThat(responseBody).containsPattern("\"createdAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
        assertThat(responseBody).containsPattern("\"updatedAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
    }
}
