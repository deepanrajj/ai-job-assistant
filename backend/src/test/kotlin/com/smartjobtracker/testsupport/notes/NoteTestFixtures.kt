package com.smartjobtracker.testsupport.notes

import com.smartjobtracker.notes.Note
import com.smartjobtracker.notes.NoteService
import com.smartjobtracker.notes.command.CreateNoteCommand
import com.smartjobtracker.notes.command.UpdateNoteCommand
import java.time.OffsetDateTime
import java.util.UUID

internal val noteFixtureTimestamp: OffsetDateTime = OffsetDateTime.parse("2026-07-05T12:00:00Z")

/**
 * Builds a note for tests. `jobId` has no default because there is no
 * sensible default job to point at; each caller passes the id it wants,
 * including an unsaved one when the test is about the foreign key.
 */
fun createNoteEntity(
    jobId: UUID,
    id: UUID = UUID.randomUUID(),
    body: String = "Recruiter said the team is hiring for a Q3 start.",
    createdAt: OffsetDateTime = noteFixtureTimestamp,
    updatedAt: OffsetDateTime = noteFixtureTimestamp,
): Note =
    Note(
        id = id,
        jobId = jobId,
        body = body,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )

class FakeNoteService : NoteService {
    lateinit var lastListedJobId: UUID
    lateinit var lastCreateJobId: UUID
    lateinit var lastCreateCommand: CreateNoteCommand
    lateinit var lastUpdateJobId: UUID
    lateinit var lastUpdateNoteId: UUID
    lateinit var lastUpdateCommand: UpdateNoteCommand
    lateinit var lastDeleteJobId: UUID
    lateinit var lastDeleteNoteId: UUID

    var listHandler: (UUID) -> List<Note> = { jobId -> listOf(createNoteEntity(jobId = jobId)) }

    var createHandler: (UUID, CreateNoteCommand) -> Note = { jobId, _ -> createNoteEntity(jobId = jobId) }

    var updateHandler: (UUID, UUID, UpdateNoteCommand) -> Note =
        { jobId, noteId, _ -> createNoteEntity(jobId = jobId, id = noteId) }

    var deleteHandler: (UUID, UUID) -> Unit = { _, _ -> }

    override fun listNotes(jobId: UUID): List<Note> {
        lastListedJobId = jobId

        return listHandler(jobId)
    }

    override fun createNote(
        jobId: UUID,
        command: CreateNoteCommand,
    ): Note {
        lastCreateJobId = jobId
        lastCreateCommand = command

        return createHandler(jobId, command)
    }

    override fun updateNote(
        jobId: UUID,
        noteId: UUID,
        command: UpdateNoteCommand,
    ): Note {
        lastUpdateJobId = jobId
        lastUpdateNoteId = noteId
        lastUpdateCommand = command

        return updateHandler(jobId, noteId, command)
    }

    override fun deleteNote(
        jobId: UUID,
        noteId: UUID,
    ) {
        lastDeleteJobId = jobId
        lastDeleteNoteId = noteId
        deleteHandler(jobId, noteId)
    }
}
