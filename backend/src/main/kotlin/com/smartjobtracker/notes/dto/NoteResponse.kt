package com.smartjobtracker.notes.dto

import com.smartjobtracker.notes.Note
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Public API representation of a saved note. Deliberately omits
 * `jobId`: every route already carries it in the path, so repeating it
 * in the body would be redundant.
 */
data class NoteResponse(
    val id: UUID,
    val body: String,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun Note.toResponse() =
    NoteResponse(
        id = id,
        body = body,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
