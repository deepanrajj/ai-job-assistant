package com.smartjobtracker.tasks

import com.smartjobtracker.persistence.AssignedIdEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Fields stay `val` because nothing mutates a task yet. The task service
 * that first edits one turns the columns it edits into `var` and mutates
 * the managed instance, as `DefaultJobService.updateJob` does; it must
 * not rebuild the entity. See [AssignedIdEntity].
 */
@Entity
@Table(name = "tasks")
class Task(
    id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Column(nullable = false)
    val title: String,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: TaskStatus,
    @Column(name = "due_date")
    val dueDate: LocalDate?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    val updatedAt: OffsetDateTime,
) : AssignedIdEntity(id)

enum class TaskStatus {
    TODO,
    DONE,
}
