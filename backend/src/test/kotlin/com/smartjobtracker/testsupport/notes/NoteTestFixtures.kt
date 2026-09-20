package com.smartjobtracker.testsupport.notes

import com.smartjobtracker.notes.Note
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
