package com.smartjobtracker.notes

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.notes.command.CreateNoteCommand
import com.smartjobtracker.notes.command.UpdateNoteCommand
import com.smartjobtracker.testsupport.api.assertApiException
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.notes.createNoteEntity
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
class NoteServiceTest {
    @Autowired
    lateinit var noteRepository: NoteRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var jobService: JobService

    private val fixedClock: Clock = Clock.fixed(Instant.parse("2026-07-05T12:00:00Z"), ZoneOffset.UTC)

    private val expectedNow: OffsetDateTime = OffsetDateTime.now(fixedClock)

    private lateinit var noteService: NoteService

    @BeforeEach
    fun setUp() {
        noteService = DefaultNoteService(jobService, noteRepository, fixedClock)
    }

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun seedNote(
        jobId: UUID,
        body: String = "Seeded note",
        createdAt: OffsetDateTime = expectedNow.minusDays(1),
    ): Note =
        noteRepository.save(
            createNoteEntity(jobId = jobId, body = body, createdAt = createdAt, updatedAt = createdAt),
        )

    @Test
    fun `lists a job's notes in creation order`() {
        val jobId = seedJob()
        seedNote(jobId, body = "Newer", createdAt = expectedNow.minusDays(1))
        seedNote(jobId, body = "Older", createdAt = expectedNow.minusDays(2))
        seedNote(seedJob(), body = "Other job")

        val bodies = noteService.listNotes(jobId).map { it.body }

        assertThat(bodies).containsExactly("Older", "Newer")
    }

    @Test
    fun `throws job not found when listing notes for a missing job`() {
        val exception = catchThrowableOfType(ApiException::class.java) { noteService.listNotes(UUID.randomUUID()) }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `creates a note with the job id and clock timestamps`() {
        val jobId = seedJob()

        val created = noteService.createNote(jobId, CreateNoteCommand(body = "Recruiter called back"))

        assertThat(created.jobId).isEqualTo(jobId)
        assertThat(created.body).isEqualTo("Recruiter called back")
        assertThat(created.createdAt).isEqualTo(expectedNow)
        assertThat(created.updatedAt).isEqualTo(expectedNow)
        assertThat(noteRepository.existsById(created.id)).isTrue()
    }

    @Test
    fun `throws job not found when creating a note for a missing job`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.createNote(UUID.randomUUID(), CreateNoteCommand(body = "Recruiter called back"))
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `updates the body, preserves id, job id, and creation time, and refreshes updatedAt`() {
        val jobId = seedJob()
        val seeded = seedNote(jobId)

        val updated = noteService.updateNote(jobId, seeded.id, UpdateNoteCommand(body = "Updated body"))

        assertThat(updated.id).isEqualTo(seeded.id)
        assertThat(updated.jobId).isEqualTo(jobId)
        assertThat(updated.createdAt).isEqualTo(seeded.createdAt)
        assertThat(updated.body).isEqualTo("Updated body")
        assertThat(updated.updatedAt).isEqualTo(expectedNow)
    }

    @Test
    fun `throws job not found when updating a note under a missing job`() {
        val jobId = seedJob()
        val seeded = seedNote(jobId)
        val command = UpdateNoteCommand(body = "Updated")

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.updateNote(UUID.randomUUID(), seeded.id, command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws note not found when updating a missing note`() {
        val jobId = seedJob()
        val command = UpdateNoteCommand(body = "Updated")

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.updateNote(jobId, UUID.randomUUID(), command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.NOTE_NOT_FOUND,
            message = "Note not found.",
        )
    }

    @Test
    fun `throws note not found and leaves it unchanged when updating a note under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedNote(otherJobId, body = "Untouched")
        val command = UpdateNoteCommand(body = "Hijacked")

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.updateNote(ownJobId, seeded.id, command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.NOTE_NOT_FOUND,
            message = "Note not found.",
        )
        val stillSeeded = noteRepository.findById(seeded.id).orElseThrow()
        assertThat(stillSeeded.body).isEqualTo("Untouched")
    }

    @Test
    fun `deletes a note`() {
        val jobId = seedJob()
        val seeded = seedNote(jobId)

        noteService.deleteNote(jobId, seeded.id)

        assertThat(noteRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `throws job not found when deleting a note under a missing job`() {
        val jobId = seedJob()
        val seeded = seedNote(jobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.deleteNote(UUID.randomUUID(), seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws note not found when deleting a missing note`() {
        val jobId = seedJob()

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.deleteNote(jobId, UUID.randomUUID())
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.NOTE_NOT_FOUND,
            message = "Note not found.",
        )
    }

    @Test
    fun `throws note not found and keeps it when deleting a note under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedNote(otherJobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                noteService.deleteNote(ownJobId, seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.NOTE_NOT_FOUND,
            message = "Note not found.",
        )
        assertThat(noteRepository.existsById(seeded.id)).isTrue()
    }
}
