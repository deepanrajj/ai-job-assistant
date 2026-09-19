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
 * Editable columns are `var` so an update mutates the managed instance
 * and lets Hibernate's dirty checking write it, as
 * `DefaultTaskService.updateTask` does; it must not rebuild the entity.
 * See [AssignedIdEntity]. `jobId` and `createdAt` stay `val` because
 * nothing moves a task to another job or rewrites when it was created.
 */
@Entity
@Table(name = "tasks")
class Task(
    id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Column(nullable = false)
    var title: String,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: TaskStatus,
    @Column(name = "due_date")
    var dueDate: LocalDate?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime,
) : AssignedIdEntity(id)

enum class TaskStatus {
    TODO,
    DONE,
}
