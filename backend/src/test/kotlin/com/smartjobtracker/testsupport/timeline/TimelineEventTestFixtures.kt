package com.smartjobtracker.testsupport.timeline

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.timeline.TimelineEvent
import com.smartjobtracker.timeline.TimelineEventService
import com.smartjobtracker.timeline.TimelineEventType
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
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

class FakeTimelineEventService : TimelineEventService {
    lateinit var lastListedJobId: UUID
    var lastListAllPage: Int = 0
    var lastListAllSize: Int = 0

    var listHandler: (UUID) -> List<TimelineEvent> = { jobId -> listOf(createTimelineEventEntity(jobId = jobId)) }

    var listAllHandler: (Int, Int) -> Page<TimelineEvent> = { page, size ->
        PageImpl(listOf(createTimelineEventEntity(jobId = UUID.randomUUID())), PageRequest.of(page, size), 1)
    }

    override fun listTimelineEvents(jobId: UUID): List<TimelineEvent> {
        lastListedJobId = jobId

        return listHandler(jobId)
    }

    override fun listAllTimelineEvents(
        page: Int,
        size: Int,
    ): Page<TimelineEvent> {
        lastListAllPage = page
        lastListAllSize = size

        return listAllHandler(page, size)
    }
}
