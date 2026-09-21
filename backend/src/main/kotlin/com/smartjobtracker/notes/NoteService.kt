package com.smartjobtracker.notes

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.notes.command.CreateNoteCommand
import com.smartjobtracker.notes.command.UpdateNoteCommand
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.OffsetDateTime
import java.util.UUID

interface NoteService {
    fun listNotes(jobId: UUID): List<Note>

    fun createNote(
        jobId: UUID,
        command: CreateNoteCommand,
    ): Note

    fun updateNote(
        jobId: UUID,
        noteId: UUID,
        command: UpdateNoteCommand,
    ): Note

    fun deleteNote(
        jobId: UUID,
        noteId: UUID,
    )
}

@Service
class DefaultNoteService(
    private val jobService: JobService,
    private val noteRepository: NoteRepository,
    private val clock: Clock,
) : NoteService {
    @Transactional
    override fun listNotes(jobId: UUID): List<Note> {
        jobService.getJob(jobId)

        return noteRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)
    }

    @Transactional
    override fun createNote(
        jobId: UUID,
        command: CreateNoteCommand,
    ): Note {
        jobService.getJob(jobId)

        val timestamp = now()
        val note =
            Note(
                id = UUID.randomUUID(),
                jobId = jobId,
                body = command.body,
                createdAt = timestamp,
                updatedAt = timestamp,
            )
        return noteRepository.save(note)
    }

    @Transactional
    override fun updateNote(
        jobId: UUID,
        noteId: UUID,
        command: UpdateNoteCommand,
    ): Note {
        jobService.getJob(jobId)

        val note = noteRepository.findByIdAndJobId(id = noteId, jobId = jobId) ?: throw noteNotFound()
        note.body = command.body
        note.updatedAt = now()
        return note
    }

    @Transactional
    override fun deleteNote(
        jobId: UUID,
        noteId: UUID,
    ) {
        jobService.getJob(jobId)

        val note = noteRepository.findByIdAndJobId(id = noteId, jobId = jobId) ?: throw noteNotFound()
        noteRepository.delete(note)
    }

    private fun now(): OffsetDateTime = OffsetDateTime.now(clock)

    private fun noteNotFound(): ApiException =
        ApiException(
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.NOTE_NOT_FOUND,
            message = "Note not found.",
        )
}
