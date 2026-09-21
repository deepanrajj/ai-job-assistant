package com.smartjobtracker.testsupport.timeline

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.timeline.TimelineEvent
import com.smartjobtracker.timeline.TimelineEventType
import java.time.OffsetDateTime
import java.util.UUID

internal val timelineEventFixtureTimestamp: OffsetDateTime = OffsetDateTime.parse("2026-07-05T12:00:00Z")

/**
 * Builds a timeline event for tests. `jobId` has no default because
 * there is no sensible default job to point at; each caller passes the
 * id it wants, including an unsaved one when the test is about the
 * foreign key. Defaults `previousStatus`/`nextStatus` to two different
 * statuses so a caller who only needs "some persisted event" already
 * exercises the structured-status columns.
 */
fun createTimelineEventEntity(
    jobId: UUID,
    id: UUID = UUID.randomUUID(),
    type: TimelineEventType = TimelineEventType.STATUS_CHANGE,
    description: String = "Status changed from Wishlist to Applied.",
    previousStatus: JobStatus? = JobStatus.WISHLIST,
    nextStatus: JobStatus? = JobStatus.APPLIED,
    createdAt: OffsetDateTime = timelineEventFixtureTimestamp,
): TimelineEvent =
    TimelineEvent(
        id = id,
        jobId = jobId,
        type = type,
        description = description,
        previousStatus = previousStatus,
        nextStatus = nextStatus,
        createdAt = createdAt,
    )
