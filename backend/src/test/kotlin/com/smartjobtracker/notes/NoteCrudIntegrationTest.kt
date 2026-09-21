package com.smartjobtracker.notes

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.notes.dto.NoteResponse
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.notes.createNoteEntity
import com.smartjobtracker.testsupport.notes.noteFixtureTimestamp
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
 * End-to-end coverage of the note routes against the real application
 * context: the real controller, service, repository, Flyway-created
 * schema, and the application's own Jackson configuration.
 *
 * Branch-level cases stay in the isolated layer tests. This class
 * covers the seams those tests replace with fakes, mirroring
 * `TaskCrudIntegrationTest`.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NoteCrudIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var noteRepository: NoteRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun postNote(
        jobId: UUID,
        body: String,
    ): NoteResponse {
        val responseBody =
            mockMvc
                .perform(
                    post("/jobs/{jobId}/notes", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                ).andExpect(status().isCreated)
                .andReturn()
                .response
                .contentAsString

        return objectMapper.readValue(responseBody, NoteResponse::class.java)
    }

    @Test
    fun `creates a note over http and stores it in the database`() {
        val jobId = seedJob()

        val created = postNote(jobId, """{"body": "Recruiter called back"}""")

        assertThat(created.body).isEqualTo("Recruiter called back")
        assertThat(created.createdAt).isEqualTo(created.updatedAt)

        val stored = noteRepository.findById(created.id)

        assertThat(stored).isPresent()
        assertThat(stored.get().jobId).isEqualTo(jobId)
        assertThat(stored.get().body).isEqualTo("Recruiter called back")
    }

    @Test
    fun `lists notes for a job in creation order`() {
        val jobId = seedJob()
        val newer =
            noteRepository.save(
                createNoteEntity(jobId = jobId, body = "Newer", createdAt = noteFixtureTimestamp.plusDays(1)),
            )
        val older =
            noteRepository.save(
                createNoteEntity(jobId = jobId, body = "Older", createdAt = noteFixtureTimestamp.minusDays(1)),
            )
        noteRepository.save(createNoteEntity(jobId = seedJob(), body = "Other job"))

        mockMvc
            .perform(get("/jobs/{jobId}/notes", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(older.id.toString()))
            .andExpect(jsonPath("$[1].id").value(newer.id.toString()))
            .andExpect(jsonPath("$", hasSize<Any>(2)))
    }

    @Test
    fun `updates a note over http and preserves its creation time`() {
        val jobId = seedJob()
        val seeded = postNote(jobId, """{"body": "Old body"}""")

        mockMvc
            .perform(
                put("/jobs/{jobId}/notes/{noteId}", jobId, seeded.id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "New body"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.body").value("New body"))

        val stored = noteRepository.findById(seeded.id).orElseThrow()

        assertThat(stored.body).isEqualTo("New body")
        assertThat(stored.createdAt).isEqualTo(seeded.createdAt)
        assertThat(stored.updatedAt).isAfterOrEqualTo(seeded.updatedAt)
    }

    @Test
    fun `deletes a note over http and removes it from the database`() {
        val jobId = seedJob()
        val seeded = postNote(jobId, """{"body": "Recruiter called back"}""")

        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", jobId, seeded.id))
            .andExpect(status().isNoContent)

        assertThat(noteRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `returns job not found for create update and delete under an unknown job`() {
        val unknownJobId = UUID.randomUUID()

        mockMvc
            .perform(
                post("/jobs/{jobId}/notes", unknownJobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "Recruiter called back"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(
                put("/jobs/{jobId}/notes/{noteId}", unknownJobId, UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "Recruiter called back"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", unknownJobId, UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns note not found for update and delete of an unknown note under a real job`() {
        val jobId = seedJob()
        val unknownNoteId = UUID.randomUUID()

        mockMvc
            .perform(
                put("/jobs/{jobId}/notes/{noteId}", jobId, unknownNoteId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "Recruiter called back"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOTE_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", jobId, unknownNoteId))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOTE_NOT_FOUND"))
    }

    @Test
    fun `returns a validation error through the real error handler`() {
        val jobId = seedJob()

        mockMvc
            .perform(
                post("/jobs/{jobId}/notes", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("body"))
    }

    @Test
    fun `response body omits job id and serializes timestamps as iso instants`() {
        val jobId = seedJob()
        postNote(jobId, """{"body": "Recruiter called back"}""")

        val responseBody =
            mockMvc
                .perform(get("/jobs/{jobId}/notes", jobId))
                .andExpect(status().isOk)
                .andReturn()
                .response
                .contentAsString

        assertThat(responseBody).doesNotContain("jobId")
        assertThat(responseBody).containsPattern("\"createdAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
        assertThat(responseBody).containsPattern("\"updatedAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
    }
}
