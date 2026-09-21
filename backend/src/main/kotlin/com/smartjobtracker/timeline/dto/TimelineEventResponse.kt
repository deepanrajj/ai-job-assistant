package com.smartjobtracker.timeline.dto

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.timeline.TimelineEvent
import com.smartjobtracker.timeline.TimelineEventType
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Public API representation of a timeline event. Unlike `TaskResponse`
 * and `NoteResponse`, `jobId` is kept: this DTO is shared by a
 * job-scoped route and a cross-job paginated route, and the cross-job
 * route cannot function without knowing which job each row belongs to.
 */
data class TimelineEventResponse(
    val id: UUID,
    val jobId: UUID,
    val type: TimelineEventType,
    val description: String,
    val previousStatus: JobStatus?,
    val nextStatus: JobStatus?,
    val createdAt: OffsetDateTime,
)

fun TimelineEvent.toResponse(): TimelineEventResponse =
    TimelineEventResponse(
        id = id,
        jobId = jobId,
        type = type,
        description = description,
        previousStatus = previousStatus,
        nextStatus = nextStatus,
        createdAt = createdAt,
    )
