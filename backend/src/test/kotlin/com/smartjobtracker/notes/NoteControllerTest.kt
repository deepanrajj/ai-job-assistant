package com.smartjobtracker.notes

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.api.error.ApiExceptionHandler
import com.smartjobtracker.testsupport.notes.FakeNoteService
import com.smartjobtracker.testsupport.notes.createNoteEntity
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

class NoteControllerTest {
    private lateinit var noteService: FakeNoteService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        noteService = FakeNoteService()
        mockMvc =
            MockMvcBuilders
                .standaloneSetup(NoteController(noteService))
                .setValidator(LocalValidatorFactoryBean().apply { afterPropertiesSet() })
                .setControllerAdvice(ApiExceptionHandler())
                .build()
    }

    @Test
    fun `lists notes for a job`() {
        val jobId = UUID.randomUUID()
        val note = createNoteEntity(jobId = jobId, body = "Recruiter called back")
        noteService.listHandler = { listOf(note) }

        mockMvc
            .perform(get("/jobs/{jobId}/notes", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(note.id.toString()))
            .andExpect(jsonPath("$[0].body").value("Recruiter called back"))
            .andExpect(jsonPath("$[0].jobId").doesNotExist())

        assertThat(noteService.lastListedJobId).isEqualTo(jobId)
    }

    @Test
    fun `creates a note and returns created`() {
        val jobId = UUID.randomUUID()
        val created = createNoteEntity(jobId = jobId, body = "Recruiter called back")
        noteService.createHandler = { _, _ -> created }

        mockMvc
            .perform(
                post("/jobs/{jobId}/notes", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "Recruiter called back"}"""),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.body").value("Recruiter called back"))

        assertThat(noteService.lastCreateJobId).isEqualTo(jobId)
        assertThat(noteService.lastCreateCommand.body).isEqualTo("Recruiter called back")
    }

    @Test
    fun `updates a note`() {
        val jobId = UUID.randomUUID()
        val noteId = UUID.randomUUID()
        noteService.updateHandler = { jId, nId, _ -> createNoteEntity(jobId = jId, id = nId, body = "Updated") }

        mockMvc
            .perform(
                put("/jobs/{jobId}/notes/{noteId}", jobId, noteId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": "Updated"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.body").value("Updated"))

        assertThat(noteService.lastUpdateJobId).isEqualTo(jobId)
        assertThat(noteService.lastUpdateNoteId).isEqualTo(noteId)
        assertThat(noteService.lastUpdateCommand.body).isEqualTo("Updated")
    }

    @Test
    fun `deletes a note and returns no content`() {
        val jobId = UUID.randomUUID()
        val noteId = UUID.randomUUID()

        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", jobId, noteId))
            .andExpect(status().isNoContent)

        assertThat(noteService.lastDeleteJobId).isEqualTo(jobId)
        assertThat(noteService.lastDeleteNoteId).isEqualTo(noteId)
    }

    @Test
    fun `rejects a create request with a blank body`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/notes", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("body"))
    }

    @Test
    fun `rejects an update request with a blank body`() {
        mockMvc
            .perform(
                put("/jobs/{jobId}/notes/{noteId}", UUID.randomUUID(), UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"body": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("body"))
    }

    @Test
    fun `returns job not found when the service reports a missing job`() {
        noteService.listHandler = {
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.JOB_NOT_FOUND,
                message = "Job not found.",
            )
        }

        mockMvc
            .perform(get("/jobs/{jobId}/notes", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns note not found when the service reports a missing note`() {
        noteService.deleteHandler = { _, _ ->
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.NOTE_NOT_FOUND,
                message = "Note not found.",
            )
        }

        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", UUID.randomUUID(), UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOTE_NOT_FOUND"))
    }

    @Test
    fun `returns bad request when the job id path segment is not a uuid`() {
        mockMvc
            .perform(get("/jobs/{jobId}/notes", "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }

    @Test
    fun `returns bad request when the note id path segment is not a uuid`() {
        mockMvc
            .perform(delete("/jobs/{jobId}/notes/{noteId}", UUID.randomUUID(), "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }
}
