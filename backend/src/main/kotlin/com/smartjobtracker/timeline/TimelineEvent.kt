package com.smartjobtracker.timeline

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.persistence.AssignedIdEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Every column is `val`. Unlike `Job`, `Task`, and `Note`, nothing ever
 * edits a recorded timeline event; there is no `updatedAt` and no
 * mutation path, so the update-by-mutation convention documented on
 * those entities does not apply here.
 */
@Entity
@Table(name = "timeline_events")
class TimelineEvent(
    id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: TimelineEventType,
    @Column(nullable = false)
    val description: String,
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    val previousStatus: JobStatus?,
    @Enumerated(EnumType.STRING)
    @Column(name = "next_status")
    val nextStatus: JobStatus?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
) : AssignedIdEntity(id)

enum class TimelineEventType {
    STATUS_CHANGE,
}
